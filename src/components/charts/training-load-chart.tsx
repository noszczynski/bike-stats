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
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

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

// Calculate Training Stress Score (TSS) based on available data
function calculateTSS(training: Training): number {
    // Base TSS calculation using available metrics
    let tss = 0;

    // Distance component (normalized to ~50 TSS for 40km ride)
    tss += (training.distance_km / 40) * 50;

    // Elevation component (normalized to add ~20 TSS for 500m elevation)
    tss += (training.elevation_gain_m / 500) * 20;

    // Heart rate component (if available)
    if (training.avg_heart_rate_bpm) {
        // Assuming max HR of 190 and threshold at 160
        const hrIntensity = training.avg_heart_rate_bpm / 190;
        tss += hrIntensity * 30;
    }

    // Effort component (if available)
    if (training.effort) {
        tss += (training.effort / 10) * 20;
    }

    return Math.round(tss);
}

export function TrainingLoadChart({ trainings }: { trainings: Training[] }) {
    // Sort trainings by date
    const sortedTrainings = [...trainings].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Calculate CTL, ATL, and TSB for each day
    let ctl = 0; // Chronic Training Load (42-day exponential average)
    let atl = 0; // Acute Training Load (7-day exponential average)

    const data = sortedTrainings.map((training, index) => {
        const tss = calculateTSS(training);

        // Update CTL and ATL using exponential moving average
        ctl = ctl + (tss - ctl) / 42;
        atl = atl + (tss - atl) / 7;

        // TSB = CTL - ATL
        const tsb = ctl - atl;

        return {
            date: training.date,
            formattedDate: date(training.date).format("DD MMM YY"),
            ctl: Number(ctl.toFixed(1)),
            atl: Number(atl.toFixed(1)),
            tsb: Number(tsb.toFixed(1)),
            tss,
        };
    });

    // Get latest values for footer
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
                        <ChartTooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;

                                return (
                                    <ChartTooltipContent
                                        className="w-[300px]"
                                        payload={payload
                                            .filter(p => p.value !== null)
                                            .map(p => {
                                                const key = p.name as keyof typeof chartConfig;
                                                const value = p.value;
                                                let formattedValue = value;

                                                if (key === "ctl") {
                                                    formattedValue = `${Number(value).toFixed(1)}`;
                                                } else if (key === "atl") {
                                                    formattedValue = `${Number(value).toFixed(1)} km`;
                                                } else if (key === "tsb") {
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
