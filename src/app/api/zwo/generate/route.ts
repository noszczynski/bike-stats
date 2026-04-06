import { completionJsonObject } from "@/lib/api/openai";
import { getAuthenticatedUserId } from "@/lib/auth";
import { normalizeCooldownStepsInWorkout } from "@/lib/zwo/persistence";
import { DEFAULT_FTP_WATTS } from "@/lib/zwo/power-zones";
import { zwoGenerateRequestSchema, zwoWorkoutSchema } from "@/lib/zwo/types";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Jesteś ekspertem od treningów kolarskich w formacie pliku .ZWO (XML).
Zwracasz WYŁĄCZNIE poprawny obiekt JSON zgodny ze schematem:
{
  "name": string,
  "description": string,
  "author": string,
  "sportType": "bike",
  "tags": string[],
  "steps": Step[]
}

Step to jeden z:
1) {"type":"Warmup","Duration":number,"PowerLow":number,"PowerHigh":number}
2) {"type":"Cooldown","Duration":number,"PowerLow":number,"PowerHigh":number}
   — wyjątek ZWO: PowerLow = moc na POCZĄTKU schłodzenia (zwykle wyższa), PowerHigh = na KOŃCU (niższa). Np. 60%→45% FTP: PowerLow 0.6, PowerHigh 0.45 (PowerLow może być większe niż PowerHigh).
3) {"type":"SteadyState","Duration":number,"Power":number}
4) {"type":"Ramp","Duration":number,"PowerLow":number,"PowerHigh":number}
5) {"type":"IntervalsT","Repeat":number,"OnDuration":number,"OffDuration":number,"OnPower":number,"OffPower":number}
6) {"type":"TextEvent","timeoffset":number,"message":string}

Zasady ogólne:
- Duration/OnDuration/OffDuration/timeoffset podawaj w sekundach.
- Power/PowerLow/PowerHigh/OnPower/OffPower to mnożnik FTP (np. 0.75 = 75% FTP).
- Trening musi mieć przynajmniej 1 krok.
- Nie zwracaj żadnego tekstu poza JSON.
- Opis ma być po polsku.

Zasady dotyczące realistycznych interwałów (IntervalsT):
- Proporcje czasu sprintu (OnDuration) do odpoczynku (OffDuration) dobieraj do intensywności, NIE stosuj domyślnie 1:1:
  * Sprinty neuromięśniowe (>150% FTP, 10–20 sek): odpoczynek 3–6x dłuższy niż sprint (np. 15 sek ON / 60–90 sek OFF)
  * Sprinty beztlenowe (130–150% FTP, 20–40 sek): odpoczynek 2–4x dłuższy (np. 30 sek ON / 90 sek OFF)
  * Interwały VO2max (110–130% FTP, 2–5 min): odpoczynek zbliżony do czasu sprintu, 1:1 do 1:1.5 (np. 3 min ON / 3–4 min OFF)
  * Interwały progowe (95–105% FTP, 5–20 min): krótszy odpoczynek niż sprint, 1:0.5 do 1:0.75 (np. 8 min ON / 4–6 min OFF)
- OffPower podczas odpoczynku powinien być aktywny (50–65% FTP), nie zerowy — kolarz pedałuje, nie stoi.
- Liczba powtórzeń (Repeat) musi być realistyczna: więcej powtórzeń przy krótszych interwałach, mniej przy długich.
- Trening powinien zawierać rozgrzewkę (Warmup) i schłodzenie (Cooldown).
`;

function uniqueTags(tags: string[]): string[] {
    return Array.from(new Set(tags.map(tag => tag.trim()).filter(Boolean)));
}

function toClampedFactor(watts: number, ftpWatts: number): number {
    const factor = watts / ftpWatts;
    return Math.min(3, Math.max(0, Number(factor.toFixed(4))));
}

function extractIntervalWatts(instruction: string): { lowWatts: number; highWatts: number } | null {
    const intervalPair = instruction.match(/(\d+(?:[.,]\d+)?)\s*W\s*\/\s*(\d+(?:[.,]\d+)?)\s*W/i);
    if (!intervalPair) {
        return null;
    }

    const firstWatts = Number(intervalPair[1].replace(",", "."));
    const secondWatts = Number(intervalPair[2].replace(",", "."));
    if (!Number.isFinite(firstWatts) || !Number.isFinite(secondWatts)) {
        return null;
    }

    return {
        lowWatts: Math.min(firstWatts, secondWatts),
        highWatts: Math.max(firstWatts, secondWatts),
    };
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await request.json();
        const parsedRequest = zwoGenerateRequestSchema.safeParse(payload);

        if (!parsedRequest.success) {
            return NextResponse.json(
                { error: "Invalid request payload", details: parsedRequest.error.flatten() },
                { status: 400 },
            );
        }

        const { instruction, currentWorkout } = parsedRequest.data;
        const ftpWatts = DEFAULT_FTP_WATTS;
        const userPrompt = `Instrukcja użytkownika:
${instruction}

FTP użytkownika: ${ftpWatts} W.
Jeśli instrukcja zawiera moc podaną w W (np. 90W/320W), przelicz ją dokładnie na mnożnik FTP:
- Dla IntervalsT: OffPower = niższa moc / FTP, OnPower = wyższa moc / FTP.
- Dla Cooldown: pierwsza wartość czasu/mocy w treści = początek schłodzenia (mapuj na PowerLow), końcowa łatwiejsza moc = PowerHigh (zgodnie z ZWO, niezależnie od słów „low/high”).
i zachowaj intencję użytkownika.

Aktualny szkic treningu (opcjonalny kontekst, możesz poprawić):
${JSON.stringify(currentWorkout || {}, null, 2)}
`;

        const rawJson = await completionJsonObject(SYSTEM_PROMPT, userPrompt);

        let generatedData: unknown;
        try {
            generatedData = JSON.parse(rawJson);
        } catch {
            return NextResponse.json(
                { error: "Model returned invalid JSON", raw: rawJson },
                { status: 422 },
            );
        }

        const parsedWorkout = zwoWorkoutSchema.safeParse(generatedData);
        if (!parsedWorkout.success) {
            return NextResponse.json(
                {
                    error: "Generated workout has invalid format",
                    details: parsedWorkout.error.flatten(),
                },
                { status: 422 },
            );
        }

        const normalizedWorkout = {
            ...parsedWorkout.data,
            tags: uniqueTags(parsedWorkout.data.tags),
            sportType: "bike" as const,
        };

        const intervalWatts = extractIntervalWatts(instruction);
        if (intervalWatts) {
            const lowFactor = toClampedFactor(intervalWatts.lowWatts, ftpWatts);
            const highFactor = toClampedFactor(intervalWatts.highWatts, ftpWatts);

            normalizedWorkout.steps = normalizedWorkout.steps.map(step => {
                if (step.type === "IntervalsT") {
                    return {
                        ...step,
                        OffPower: lowFactor,
                        OnPower: highFactor,
                    };
                }

                return step;
            });
        }

        return NextResponse.json({
            workout: normalizeCooldownStepsInWorkout(normalizedWorkout),
        });
    } catch (error) {
        console.error("ZWO generation error:", error);
        return NextResponse.json(
            { error: "Wystąpił błąd podczas generowania treningu" },
            { status: 500 },
        );
    }
}
