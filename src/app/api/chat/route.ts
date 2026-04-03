import { openai } from "@/lib/api/openai";
import { createTrainerTools } from "@/lib/ai/tools";
import { getAuthenticatedUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type OpenAILanguageModelResponsesOptions } from "@ai-sdk/openai";
import { stepCountIs, streamText } from "ai";
import { NextRequest } from "next/server";
import date from "../../../lib/date";
import dayjs from "../../../lib/date";

const TRAINER_SYSTEM = `Jesteś AI trenerem rowerowym i endurance. Pomagasz analizować zapisy treningów użytkownika. Analizujesz tylko trening rowerowy (rower szosowy lub trenażer).

ZASADY:
1. Odpowiadaj wyłącznie po polsku.
2. Nie uczestnicz w diagnozie medycznej — tylko trening, regeneracja ogólna, planowanie obciążeń (bez „leczenia”).
3. Formatuj odpowiedzi w Markdown (nagłówki ##/###, listy, **pogrubienia**, \`metryki\`).
4. Nie zmyślaj danych. Jeśli potrzebujesz faktów z bazy, wywołaj narzędzie (tool).
5. Preferuj małe, wyspecjalizowane narzędzia zamiast jednego szerokiego, jeśli pytanie da się rozbić na kilka niezależnych fragmentów.
6. Jeśli potrzebujesz kilku niezależnych danych, możesz wywołać kilka narzędzi równolegle.
7. Nadal unikaj zbędnych wywołań — pobieraj tylko to, co realnie potrzebne do odpowiedzi.
8. Nie doprecyzowuj pytań użytkownika jeśli możesz wywnioskować jego input z kontekstu, miej autonomie, najwyżej użytkownik sam doprecyzuje.
9. Jeśli nie masz pewności że pytanie użytkownika z pewnoścą nie jest zrozumiałe lub precyzyjne, tylko wtedy zapytaj o doprecyzowanie.
10. Jeśli nie masz pewności że odpowiedź nie jest taka jakiej oczekuje użytkownik, poproś o więcej informacji.
11. Nie wykorzystuj parametrów input w narzędziach jeśli nie są one wymagane do odpowiedzi, zwracaj w nich undefined lub nie zwracaj ich wcale.

NARZĘDZIA (TOOLS):
- get_recent_activities — lista aktywności z filtrami, tagami i lekkim fit_from_file.
- get_activity_overview — zwięzły przegląd jednej aktywności.
- get_activity_fit_summary — zwarte metryki FIT dla aktywności.
- get_activity_laps — lista okrążeń do analizy interwałów.
- get_activity_tags — tagi aktywności z metadanymi.
- get_activity_zone_breakdown — breakdown stref tętna zapisany przy sesji.
- get_activity_sensor_summary — dostępność mocy, HR, kadencji, GPS i liczba próbek.
- get_activity_details — szeroki snapshot aktywności, gdy jeden pełny widok jest wygodniejszy.
- get_user_profile — profil użytkownika i strefy HR.
- get_period_summary — statystyki za okres, opcjonalnie dla typu aktywności.
- compare_period_summaries — porównanie dwóch okresów.
- get_performance_trends — alias dla statystyk okresowych.

STAŁE:
- Używane jednostki miary: km, h, km/h, W, bpm;
- Obecna data i godzina: ${dayjs().format("YYYY-MM-DD HH:mm:ss")};
- Aktualny czas UTC: ${dayjs().utc().format("YYYY-MM-DD HH:mm:ss")};

Wartości domyślne:
- Okres: 30 dni;
- Typ aktywności: wszystkie związane z rowerem szosowym lub trenażerem: ride, virtual_ride;
- Filtr po tagu: brak;
- Czy ma przetworzony plik FIT: true;

Gdy pytanie jest ogólne lub bezkontekstowe, możesz odpowiedzieć bez narzędzi. Gdy chodzi o konkretne liczby lub trendy — zawsze pobierz je narzędziami.`;

export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return new Response("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const message = typeof body.message === "string" ? body.message.trim() : "";

        let conversationId: string | undefined =
            typeof body.conversationId === "string" ? body.conversationId : undefined;

        if (!message) {
            return new Response("Message required", { status: 400 });
        }

        let conversation = conversationId
            ? await prisma.conversation.findFirst({
                  where: { id: conversationId, user_id: userId },
              })
            : null;

        if (conversationId && !conversation) {
            return new Response("Conversation not found", { status: 404 });
        }

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: { user_id: userId },
            });
            conversationId = conversation.id;
        }

        await prisma.conversationMessage.create({
            data: {
                conversation_id: conversationId!,
                role: "user",
                content: message,
            },
        });

        const rowsDesc = await prisma.conversationMessage.findMany({
            where: { conversation_id: conversationId! },
            orderBy: { created_at: "desc" },
            take: 20,
        });
        const ordered = [...rowsDesc].reverse();

        const lm = ordered
            .filter(m => m.role === "user" || m.role === "assistant")
            .map(m => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            }));

        const needsTitle = !conversation.title;

        const result = streamText({
            model: openai("gpt-5.4"),
            system: TRAINER_SYSTEM,
            messages: lm,
            tools: createTrainerTools(userId),
            providerOptions: {
                openai: {
                    parallelToolCalls: true,
                } satisfies OpenAILanguageModelResponsesOptions,
            },
            stopWhen: stepCountIs(8),
            onFinish: async ({ text }) => {
                await prisma.conversationMessage.create({
                    data: {
                        conversation_id: conversationId!,
                        role: "assistant",
                        content: text,
                    },
                });

                if (needsTitle) {
                    const title = message.length > 80 ? `${message.slice(0, 77)}…` : message;
                    await prisma.conversation.update({
                        where: { id: conversationId! },
                        data: { title },
                    });
                }
            },
        });

        return result.toTextStreamResponse({
            headers: {
                "X-Conversation-Id": conversationId!,
            },
        });
    } catch (error) {
        console.error("Chat API error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
