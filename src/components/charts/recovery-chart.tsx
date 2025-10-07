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
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

const chartConfig = {
    recoveryTime: {
        label: "Czas recovery (dni)",
        color: "#3b82f6",
    },
    intensity: {
        label: "Intensywność",
        color: "#ef4444",
    },
    form: {
        label: "Forma",
        color: "#10b981",
    },
};

export function RecoveryChart({ trainings }: { trainings: Training[] }) {
    // Sort trainings by date
    const sortedTrainings = [...trainings].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Calculate recovery time between trainings
    const data = sortedTrainings.map((training, index) => {
        let recoveryDays = 0;
        let intensity = 0;

        if (index > 0) {
            const prevDate = new Date(sortedTrainings[index - 1].date);
            const currDate = new Date(training.date);
            recoveryDays = Math.floor(
                (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
            );
        }

        // Calculate intensity based on available metrics
        if (training.avg_heart_rate_bpm) {
            intensity += (training.avg_heart_rate_bpm / 190) * 40;
        }
        if (training.effort) {
            intensity += (training.effort / 10) * 30;
        }
        intensity += (training.avg_speed_kmh / 35) * 15;
        intensity += (training.elevation_gain_m / 1000) * 15;

        // Convert moving_time (hh:mm:ss) to minutes
        const timeParts = training.moving_time.split(":").map(Number);
        const durationMinutes =
            (timeParts[0] || 0) * 60 + // hours to minutes
            (timeParts[1] || 0) + // minutes
            (timeParts[2] || 0) / 60; // seconds to minutes

        // Calculate training load (stress) for this training
        const trainingLoad = intensity * (durationMinutes / 60);

        return {
            date: training.date,
            formattedDate: date(training.date).format("DD MMM"),
            recoveryTime: recoveryDays,
            intensity: Number(intensity.toFixed(1)),
            trainingLoad: Number(trainingLoad.toFixed(1)),
            name: training.name,
        };
    });

    // Calculate Fitness (CTL - Chronic Training Load) and Fatigue (ATL - Acute Training Load)
    // Fitness = 42-day exponential moving average
    // Fatigue = 7-day exponential moving average
    // Form (TSB) = Fitness - Fatigue
    const fitnessDecay = 0.93; // ~42 day time constant
    const fatigueDecay = 0.6; // ~7 day time constant

    let fitness = 0;
    let fatigue = 0;

    const dataWithForm = data.map((item, index) => {
        // Update fitness and fatigue with exponential moving average
        fitness = fitness * fitnessDecay + item.trainingLoad * (1 - fitnessDecay);
        fatigue = fatigue * fatigueDecay + item.trainingLoad * (1 - fatigueDecay);

        // Form (TSB) = Fitness - Fatigue
        // Positive = fresh, ready to perform
        // Negative = fatigued
        const form = fitness - fatigue;

        return {
            ...item,
            form: Number(form.toFixed(1)),
        };
    });

    // Calculate statistics
    const avgRecoveryTime =
        dataWithForm.reduce((sum, d) => sum + d.recoveryTime, 0) / (dataWithForm.length - 1) || 0;

    // Count recovery patterns
    const shortRecovery = dataWithForm.filter(
        d => d.recoveryTime >= 1 && d.recoveryTime <= 1,
    ).length;
    const optimalRecovery = dataWithForm.filter(
        d => d.recoveryTime >= 2 && d.recoveryTime <= 3,
    ).length;
    const longRecovery = dataWithForm.filter(d => d.recoveryTime >= 4).length;

    // Calculate consistency score (0-100)
    const recoveryStdDev = Math.sqrt(
        dataWithForm.reduce((sum, d) => sum + Math.pow(d.recoveryTime - avgRecoveryTime, 2), 0) /
            (dataWithForm.length - 1),
    );
    const consistencyScore = Math.max(0, 100 - recoveryStdDev * 10);

    // Identify potential overtraining (high intensity with short recovery OR negative form)
    const overtrainingRisk = dataWithForm.filter(
        d => (d.intensity > 60 && d.recoveryTime < 2 && d.recoveryTime > 0) || d.form < -30,
    ).length;

    // Calculate average form and form trend
    const avgForm = dataWithForm.reduce((sum, d) => sum + d.form, 0) / dataWithForm.length || 0;
    const recentForm =
        dataWithForm.slice(-5).reduce((sum, d) => sum + d.form, 0) /
            Math.min(5, dataWithForm.length) || 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CardTitle>Recovery i regularność</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <InfoIcon className="text-muted-foreground h-4 w-4" />
                            </TooltipTrigger>
                            <TooltipContent className="w-[400px]">
                                <p className="mb-2 font-semibold">Analiza recovery i formy:</p>
                                <ul className="space-y-1 text-sm">
                                    <li>
                                        <strong>Krótki recovery</strong> - 1 dzień: Dobry dla
                                        lekkich treningów
                                    </li>
                                    <li>
                                        <strong>Optymalny recovery</strong> - 2-3 dni: Idealny dla
                                        większości treningów
                                    </li>
                                    <li>
                                        <strong>Długi recovery</strong> - 4+ dni: Może wskazywać na
                                        przerwę
                                    </li>
                                </ul>
                                <p className="mt-2 text-sm">
                                    <strong>Forma (TSB):</strong> Różnica między długoterminową
                                    adaptacją a krótkoterminowym zmęczeniem
                                </p>
                                <ul className="mt-1 space-y-1 text-sm">
                                    <li>Forma &gt; 5: Świetna forma, gotowość</li>
                                    <li>Forma -10 do 5: Produktywne zmęczenie</li>
                                    <li>Forma &lt; -30: Ryzyko przetrenowania</li>
                                </ul>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <CardDescription>
                    Analiza czasu regeneracji między treningami i wzorców treningu
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-auto h-80">
                    <ComposedChart
                        data={dataWithForm}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="formattedDate" tickLine={false} axisLine={false} />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            label={{ value: "Dni", angle: -90, position: "insideLeft" }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            label={{
                                value: "Intensywność / Forma",
                                angle: 90,
                                position: "insideRight",
                            }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <ChartTooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;

                                const data = payload[0].payload;

                                return (
                                    <div className="bg-background rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">{data.name}</p>
                                            <p className="text-muted-foreground text-xs">
                                                {date(data.date).format("DD MMM YYYY")}
                                            </p>
                                            <div className="mt-2 space-y-1 text-xs">
                                                <p>
                                                    Recovery:{" "}
                                                    <span className="font-medium">
                                                        {data.recoveryTime} dni
                                                    </span>
                                                </p>
                                                <p>
                                                    Intensywność:{" "}
                                                    <span className="font-medium">
                                                        {data.intensity.toFixed(0)}
                                                    </span>
                                                </p>
                                                <p>
                                                    Forma:{" "}
                                                    <span
                                                        className={`font-medium ${
                                                            data.form > 5
                                                                ? "text-green-500"
                                                                : data.form < -30
                                                                  ? "text-red-500"
                                                                  : "text-yellow-500"
                                                        }`}
                                                    >
                                                        {data.form > 0 ? "+" : ""}
                                                        {data.form.toFixed(1)}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }}
                        />
                        <Bar
                            dataKey="recoveryTime"
                            yAxisId="left"
                            fill={chartConfig.recoveryTime.color}
                            radius={[4, 4, 0, 0]}
                        />
                        <Line
                            name="intensity"
                            type="monotone"
                            dataKey="intensity"
                            yAxisId="right"
                            stroke={chartConfig.intensity.color}
                            strokeWidth={2}
                            dot={{ fill: chartConfig.intensity.color, r: 3 }}
                        />
                        <Line
                            name="form"
                            type="monotone"
                            dataKey="form"
                            yAxisId="right"
                            stroke={chartConfig.form.color}
                            strokeWidth={2}
                            dot={{ fill: chartConfig.form.color, r: 3 }}
                        />
                        <ChartLegend
                            content={({ payload }) => {
                                if (payload && payload.length) {
                                    return <ChartLegendContent payload={payload} />;
                                }

                                return null;
                            }}
                        />
                    </ComposedChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    <ActivityIcon className="h-4 w-4" />
                    Średni czas recovery: {avgRecoveryTime.toFixed(1)} dni • Regularność:{" "}
                    {consistencyScore.toFixed(0)}/100
                </div>
                <div className="text-muted-foreground leading-none">
                    Krótki: {shortRecovery} | Optymalny: {optimalRecovery} | Długi: {longRecovery}
                </div>
                <div className="leading-none">
                    <span className="text-muted-foreground">Forma: </span>
                    <span
                        className={`font-medium ${
                            recentForm > 5
                                ? "text-green-500"
                                : recentForm < -30
                                  ? "text-red-500"
                                  : "text-yellow-500"
                        }`}
                    >
                        {recentForm > 0 ? "+" : ""}
                        {recentForm.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground ml-2 text-xs">
                        (ostatnie 5 treningów)
                    </span>
                </div>
                {overtrainingRisk > 0 && (
                    <div className="text-xs leading-none text-orange-500">
                        ⚠️ Ryzyko przetrenowania: {overtrainingRisk} przypadków wysokiej
                        intensywności z krótkim recovery lub negatywnej formy
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
