import { client, openai } from "@/lib/api/openai";
import { createTrainerTools } from "@/lib/ai/tools";
import { getAuthenticatedUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type OpenAILanguageModelResponsesOptions } from "@ai-sdk/openai";
import { stepCountIs, streamText } from "ai";
import { NextRequest } from "next/server";
import dayjs from "../../../lib/date";

const MAX_AGENT_STEPS = 3;
const TITLE_MODEL = "gpt-5.4-nano";
const MAX_TITLE_LENGTH = 48;

type ChatMessage = {
    role: "user" | "assistant";
    content: string;
};

function sanitizeTitle(value: string) {
    return value
        .replace(/\s+/g, " ")
        .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
        .trim();
}

function normalizeTitle(value: string) {
    return sanitizeTitle(value).slice(0, MAX_TITLE_LENGTH).trim();
}

function fallbackTitle(message: string) {
    const normalized = sanitizeTitle(message);

    if (normalized.length <= MAX_TITLE_LENGTH) {
        return normalized;
    }

    return `${normalized.slice(0, MAX_TITLE_LENGTH - 1).trim()}…`;
}

async function generateConversationTitle(messages: ChatMessage[]) {
    const preview = messages
        .slice(-6)
        .map(({ role, content }) => {
            const speaker = role === "user" ? "Użytkownik" : "Asystent";
            const normalizedContent = content.replace(/\s+/g, " ").trim().slice(0, 240);

            return `${speaker}: ${normalizedContent}`;
        })
        .join("\n");

    const response = await client.responses.create({
        model: TITLE_MODEL,
        instructions: `Tworzysz tytuły konwersacji po polsku.
Zwróć wyłącznie sam tytuł, bez cudzysłowów i bez kropki.
Tytuł ma być maksymalnie zwięzły, najlepiej 2-5 słów, maksymalnie ${MAX_TITLE_LENGTH} znaków.
Skup się na głównym celu lub temacie rozmowy treningowej.`,
        input: preview,
    });

    return normalizeTitle(response.output_text);
}

const TRAINER_SYSTEM = `Jesteś doświadczonym trenerem rowerowym i endurance. Piszesz do zawodnika jak po treningu albo w krótkiej wiadomości: konkretnie, po ludzku, bez tonu „raportu z biura”. Pomagasz w odczycie zapisów treningów; zakres to wyłącznie jazda szosowa lub trenażer.

STYL I FORMA:
- Odpowiadaj wyłącznie po polsku.
- Zaczynaj od sedna: pierwsze zdanie (albo dwa) niech bezpośrednio odpowiada na pytanie albo daje główny wniosek. Dopiero potem dopowiedz, skąd to wynika — krótko, w jednym lub dwóch akapitach, jak w naturalnej rozmowie.
- Trzymaj się zwięzłości: mniej „obwódki” wokół treści, więcej treści. Jeśli coś można powiedzieć w jednym zdaniu, nie rozwlekaj tego na pięć.
- Gdy podajesz liczby lub metryki, wpleć je w zdania (Markdown: sporadyczne **akcenty** i \`wartości liczbowe\` są w porządku). Strukturę typu lista lub wyraźne bloki zarezerwuj na sytuacje, w których użytkownik prosi o plan krok po kroku, harmonogram albo zestawienie, albo bez tego faktycznie ginie sens odpowiedzi.
- Nie uczestnicz w diagnozie medycznej — tylko trening, ogólna regeneracja i planowanie obciążeń, bez „leczenia”.

DANE I NARZĘDZIA:
- Nie zmyślaj faktów. Potrzebne liczby i stany z bazy pobieraj narzędziami (tool).
- Preferuj małe, wyspecjalizowane narzędzia zamiast jednego szerokiego, gdy pytanie da się rozłożyć na niezależne fragmenty.
- Przy kilku niezależnych potrzebach możesz wywołać narzędzia równolegle; unikaj zbędnych wywołań — tylko to, co realnie zmienia odpowiedź.
- W parametrach narzędzi nie podawaj pól, które nie są potrzebne — zwracaj undefined albo pomijaj je.

AUTONOMIA I DOPRECYZOWANIA:
- Jeśli intencję da się sensownie odczytać z kontekstu, działaj bez pytania o wyjaśnienia — użytkownik doprecyzuje, gdy będzie chciał.
- Pytaj o doprecyzowanie dopiero wtedy, gdy bez tego odpowiedź byłaby zgadywaniem albo ryzykowna.
- Jeśli bez dodatkowych informacji od zawodnika nie dasz rady sensownie pomóc, poproś krótko o brakujący element — bez rozbudowanych wyjaśnień „dlaczego pytasz”.

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
- list_workouts — lista zapisanych treningów użytkownika do przeglądu lub wyboru.
- get_workout — szczegóły jednego zapisanego treningu wraz z krokami.
- create_workout — zapisanie nowego treningu użytkownika.
- update_workout — aktualizacja istniejącego treningu użytkownika.
- delete_workout — usunięcie zapisanego treningu użytkownika.

STAŁE:
- Używane jednostki miary: km, h, km/h, W, bpm;
- Obecna data i godzina: ${dayjs().format("YYYY-MM-DD HH:mm:ss")};
- Aktualny czas UTC: ${dayjs().utc().format("YYYY-MM-DD HH:mm:ss")};

Wartości domyślne:
- Okres: 30 dni;
- Typ aktywności: wszystkie związane z rowerem szosowym lub trenażerem: ride, virtual_ride;
- Filtr po tagu: brak;
- Czy ma przetworzony plik FIT: true;

Gdy pytanie jest ogólne lub bezkontekstowe, możesz odpowiedzieć bez narzędzi. Gdy chodzi o konkretne liczby lub trendy — zawsze pobierz je narzędziami.

TRYB PRACY AGENTA:
- Działasz iteracyjnie jak agent i masz maksymalnie ${MAX_AGENT_STEPS} iteracje.
- Na początku przeanalizuj prośbę użytkownika i zdecyduj, czy potrzebujesz narzędzi.
- Po każdej iteracji oceń, czy zebrane informacje naprawdę rozwiązują pytanie użytkownika.
- Jeśli brakuje danych, wykonaj tylko kolejne niezbędne wywołania narzędzi.
- Gdy masz już wystarczający kontekst, zakończ pracę odpowiedzią do użytkownika zamiast wykonywać kolejne kroki.
- W ostatniej iteracji nie planuj dalszych działań: zwróć najlepszą możliwą odpowiedź na bazie zebranych danych i jasno wskaż ewentualne braki.
- Nie pokazuj użytkownikowi swojego wewnętrznego toku rozumowania ani numerów iteracji.`;

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

        const [rowsDesc, messageCountBeforeAssistant] = await Promise.all([
            prisma.conversationMessage.findMany({
                where: { conversation_id: conversationId! },
                orderBy: { created_at: "desc" },
                take: 20,
            }),
            prisma.conversationMessage.count({
                where: { conversation_id: conversationId! },
            }),
        ]);
        const ordered = [...rowsDesc].reverse();

        const lm = ordered
            .filter(m => m.role === "user" || m.role === "assistant")
            .map(m => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            }));

        const shouldRefreshTitle =
            !conversation.title || (messageCountBeforeAssistant + 1) % 4 === 0;

        const result = streamText({
            model: openai("gpt-5.4"),
            system: TRAINER_SYSTEM,
            messages: lm,
            tools: createTrainerTools(userId),
            prepareStep: async ({ steps }) => {
                const currentStep = steps.length + 1;
                const isLastStep = currentStep >= MAX_AGENT_STEPS;

                return {
                    activeTools: isLastStep ? [] : undefined,
                    system: `${TRAINER_SYSTEM}

AKTUALNA ITERACJA: ${currentStep}/${MAX_AGENT_STEPS}
- Najpierw oceń, czy pytanie użytkownika jest już rozwiązane.
- Jeśli nie, pobierz tylko brakujące dane.
${isLastStep ? "- To ostatnia iteracja. Nie używaj już narzędzi i sformułuj finalną zwięzłą odpowiedź dla użytkownika na podstawie tego, co masz." : "- Jeśli narzędzia nie są potrzebne, odpowiedz od razu."}`,
                };
            },
            providerOptions: {
                openai: {
                    parallelToolCalls: true,
                } satisfies OpenAILanguageModelResponsesOptions,
            },
            stopWhen: stepCountIs(MAX_AGENT_STEPS),
            onFinish: async ({ text }) => {
                await prisma.conversationMessage.create({
                    data: {
                        conversation_id: conversationId!,
                        role: "assistant",
                        content: text,
                    },
                });

                if (shouldRefreshTitle) {
                    let title = fallbackTitle(message);

                    try {
                        const generatedTitle = await generateConversationTitle([
                            ...lm,
                            { role: "assistant", content: text },
                        ]);

                        if (generatedTitle) {
                            title = generatedTitle;
                        }
                    } catch (titleError) {
                        console.error("Conversation title generation error:", titleError);
                    }

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
