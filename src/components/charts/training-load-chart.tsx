"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import date from "@/lib/date";
import { Training } from "@/types/training";
import { ActivityIcon, InfoIcon } from "lucide-react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    XAxis,
    YAxis,
} from "recharts";

const chartConfig = {
    ctl: {
        label: "CTL (Chroniczne Obciążenie Treningowe)",
        color: "#10b981",
    },
    atl: {
        label: "ATL (Akutne Obciążenie Treningowe)",
        color: "#f59e0b",
    },
    tsb: {
        label: "TSB (Balans Stresu Treningowego)",
        color: "#3b82f6",
    },
};

// Obliczanie Wyniku Stresu Treningowego (TSS) na podstawie dostępnych danych
function calculateTSS(training: Training): number {
    // === DANE WEJŚCIOWE ===
    const durationSec = training.moving_time
        .split(":")
        .map(Number)
        .reduce((acc, curr) => acc * 60 + curr, 0); // np. 5400 seconds = 1.5 hours
    const avgHrBpm = training.avg_heart_rate_bpm ?? 0; // średnie tętno
    const lthrBpm = 180; // próg tętna (LTHR) stałe

    // === WALIDACJA ===
    if (durationSec <= 0 || avgHrBpm <= 0 || lthrBpm <= 0) {
        throw new Error("Nieprawidłowe dane wejściowe");
    }

    // === OBLICZENIA ===
    const hours = durationSec / 3600;
    const intensityFactor = avgHrBpm / lthrBpm;

    const tss = hours * intensityFactor * intensityFactor * 100;

    return Math.round(tss);
}

export function TrainingLoadChart({ trainings }: { trainings: Training[] }) {
    // 1. Zakres dat: od najstarszego treningu do dziś
    const sortedTrainings = [...trainings].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const firstDate = sortedTrainings[0] ? sortedTrainings[0].date : null;
    const todayDate = date().format("YYYY-MM-DD");

    if (!firstDate) {
        // Brak treningów — zwracamy pustą tablicę
        return null;
    }

    // 2. Generuj wszystkie dni od najstarszego treningu do dzisiaj
    let days: string[] = [];
    let day = date(firstDate);
    const endDay = date(todayDate);
    while (day.isBefore(endDay) || day.isSame(endDay, "day")) {
        days.push(day.format("YYYY-MM-DD"));
        day = day.add(1, "day");
    }

    // 3. Grupuj treningi wg dni (może być >1 trening/dzień)
    const trainingsByDay = days.map(dayStr => sortedTrainings.filter(t => t.date === dayStr));

    // 4. Obliczaj TSS/tssSum per day
    const DAYS_CTL = 42;
    const DAYS_ATL = 7;
    let ctl = 0;
    let atl = 0;
    const data = days.map((dayStr, i) => {
        const trainings = trainingsByDay[i];
        const tss = trainings.reduce((sum, t) => {
            try {
                return sum + calculateTSS(t);
            } catch {
                return sum;
            }
        }, 0);

        // Nazwa ostatniego treningu w danym dniu (jeśli był)
        let trainingName = null;
        if (trainings.length > 0) {
            // Jeśli chcesz sprawdzić godzinę to tu można rozwinąć logikę
            trainingName = trainings[trainings.length - 1].name;
        }

        ctl += (tss - ctl) / DAYS_CTL;
        atl += (tss - atl) / DAYS_ATL;
        const tsb = ctl - atl;
        return {
            date: dayStr,
            formattedDate: date(dayStr).format("DD MMM YY"),
            ctl: Number(ctl.toFixed(1)),
            atl: Number(atl.toFixed(1)),
            tsb: Number(tsb.toFixed(1)),
            tss,
            trainingName, // Dodane pole
        };
    });

    // Pobierz najnowsze wartości dla stopki
    const latestData = data[data.length - 1];
    const tsbStatus =
        latestData?.tsb > 5
            ? "Świeży - dobry moment na intensywny trening"
            : latestData?.tsb < -10
              ? "Zmęczony - potrzebujesz odpoczynku"
              : "Optymalny - dobry balans";

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CardTitle>Obciążenie treningowe</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <InfoIcon className="text-muted-foreground h-4 w-4" />
                            </TooltipTrigger>
                            <TooltipContent className="w-[350px]">
                                <p className="mb-2 font-semibold">
                                    Metryki obciążenia treningowego:
                                </p>
                                <ul className="space-y-1 text-sm">
                                    <li>
                                        <strong>CTL</strong> - Chroniczne obciążenie (42 dni): Twoja
                                        forma i wytrzymałość
                                    </li>
                                    <li>
                                        <strong>ATL</strong> - Akutne obciążenie (7 dni): Twoje
                                        obecne zmęczenie
                                    </li>
                                    <li>
                                        <strong>TSB</strong> - Balans treningowy (CTL - ATL):
                                        Gotowość do treningu
                                    </li>
                                </ul>
                                <p className="mt-2 text-sm">
                                    <strong>TSB:</strong> &gt;5 = świeży, -10 do 5 = optymalny,
                                    &lt;-10 = zmęczony
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <CardDescription>
                    CTL, ATL i TSB - zarządzanie formą i obciążeniem treningowym
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-auto h-80">
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="formattedDate" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        {/* Gruba linia Y=0 */}
                        <ReferenceLine
                            y={0}
                            stroke="#ffffff"
                            strokeWidth={1}
                            ifOverflow="extendDomain"
                            isFront={false}
                        />
                        <ChartTooltip
                            content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                // Próbujemy znaleźć pełne dane punktu z wykresu (np. data, trainingName)
                                const point = data.find(d => d.formattedDate === label);

                                return (
                                    <div className="w-[300px] p-3">
                                        <div className="text-muted-foreground mb-1 text-xs">
                                            {point?.date || label}
                                        </div>
                                        {point?.trainingName && (
                                            <div className="mb-1 text-sm font-medium">
                                                {point.trainingName}
                                            </div>
                                        )}
                                        <ChartTooltipContent
                                            className="w-full"
                                            payload={payload
                                                .filter(p => p.value !== null)
                                                .map(p => {
                                                    const key = p.name as keyof typeof chartConfig;
                                                    const value = p.value;
                                                    let formattedValue = value;
                                                    if (
                                                        key === "ctl" ||
                                                        key === "atl" ||
                                                        key === "tsb"
                                                    ) {
                                                        formattedValue = `${Number(value).toFixed(1)}`;
                                                    }
                                                    return {
                                                        ...p,
                                                        value: formattedValue,
                                                        name: chartConfig[key].label,
                                                    };
                                                })}
                                            active={active}
                                        />
                                    </div>
                                );
                            }}
                        />
                        <Line
                            name="ctl"
                            type="monotone"
                            dataKey="ctl"
                            stroke={chartConfig.ctl.color}
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            name="atl"
                            type="monotone"
                            dataKey="atl"
                            stroke={chartConfig.atl.color}
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            name="tsb"
                            type="monotone"
                            dataKey="tsb"
                            stroke={chartConfig.tsb.color}
                            strokeWidth={2}
                            dot={false}
                        />
                        <ChartLegend
                            content={({ payload }) => {
                                if (payload && payload.length) {
                                    return <ChartLegendContent payload={payload} />;
                                }

                                return null;
                            }}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    <ActivityIcon className="h-4 w-4" />
                    TSB: {latestData?.tsb.toFixed(1)}
                </div>
                <div className="text-muted-foreground leading-none">{tsbStatus}</div>
            </CardFooter>
        </Card>
    );
}
