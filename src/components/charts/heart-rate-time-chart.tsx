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
import date from "@/lib/date";
import { Training } from "@/types/training";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
    avgHeartRate: {
        label: "Średnie tętno (bpm)",
        color: "#ef4444",
    },
    maxHeartRate: {
        label: "Maksymalne tętno (bpm)",
        color: "#4f46e5",
    },
};

export function HeartRateTimeChart({ trainings }: { trainings: Training[] }) {
    // Filter trainings with heart rate data and sort by date
    const sortedTrainings = [...trainings]
        .filter(t => t.avg_heart_rate_bpm && t.max_heart_rate_bpm)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sortedTrainings.length < 2) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Tętno w czasie</CardTitle>
                    <CardDescription>Średnie i maksymalne tętno podczas treningów</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-muted-foreground flex h-80 items-center justify-center">
                        Brak wystarczających danych o tętnie
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Calculate moving averages
    const data = sortedTrainings.map((training, index) => {
        // Get all trainings up to current index (inclusive) for moving average
        const trainingsToAverage = sortedTrainings.slice(0, index + 1);

        // Calculate moving average for avg heart rate
        const avgHeartRateMovingAvg =
            trainingsToAverage.reduce((sum, t) => sum + (t.avg_heart_rate_bpm || 0), 0) /
            trainingsToAverage.length;

        // Calculate moving average for max heart rate
        const maxHeartRateMovingAvg =
            trainingsToAverage.reduce((sum, t) => sum + (t.max_heart_rate_bpm || 0), 0) /
            trainingsToAverage.length;

        return {
            date: training.date,
            formattedDate: date(training.date).format("MMM YYYY"),
            avgHeartRate: Number(avgHeartRateMovingAvg.toFixed(1)),
            maxHeartRate: Number(maxHeartRateMovingAvg.toFixed(1)),
            rawAvgHeartRate: training.avg_heart_rate_bpm,
            rawMaxHeartRate: training.max_heart_rate_bpm,
        };
    });

    // Calculate trend for average heart rate
    const firstAvgHeartRate = data[0]?.avgHeartRate || 0;
    const lastAvgHeartRate = data[data.length - 1]?.avgHeartRate || 0;
    const heartRateTrend = ((lastAvgHeartRate - firstAvgHeartRate) / firstAvgHeartRate) * 100;

    const TrendIcon = heartRateTrend > 0 ? TrendingUpIcon : TrendingDownIcon;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tętno w czasie</CardTitle>
                <CardDescription>Średnia krocząca tętna podczas treningów</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-auto h-80">
                    <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="formattedDate" tickLine={false} axisLine={false} />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            label={{ value: "BPM (średnie)", angle: -90, position: "insideLeft" }}
                            tickLine={false}
                            axisLine={false}
                            domain={["dataMin - 5", "dataMax + 5"]}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            label={{
                                value: "BPM (maksymalne)",
                                angle: 90,
                                position: "insideRight",
                            }}
                            tickLine={false}
                            axisLine={false}
                            domain={["dataMin - 5", "dataMax + 5"]}
                        />
                        <ChartTooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;

                                return (
                                    <ChartTooltipContent
                                        className="w-[250px]"
                                        payload={payload.map(p => {
                                            const key =
                                                p.name === "avgHeartRate"
                                                    ? "avgHeartRate"
                                                    : "maxHeartRate";
                                            const rawKey =
                                                p.name === "avgHeartRate"
                                                    ? "rawAvgHeartRate"
                                                    : "rawMaxHeartRate";
                                            const rawValue = payload[0]?.payload[rawKey];

                                            return {
                                                ...p,
                                                value: `${p.value} bpm (pojedynczy trening: ${rawValue} bpm)`,
                                                name: chartConfig[key].label,
                                            };
                                        })}
                                        active={active}
                                    />
                                );
                            }}
                        />
                        <Area
                            name="avgHeartRate"
                            type="monotone"
                            dataKey="avgHeartRate"
                            yAxisId="left"
                            fill={chartConfig.avgHeartRate.color}
                            stroke={chartConfig.avgHeartRate.color}
                            fillOpacity={0.3}
                        />
                        <Area
                            name="maxHeartRate"
                            type="monotone"
                            dataKey="maxHeartRate"
                            yAxisId="right"
                            fill={chartConfig.maxHeartRate.color}
                            stroke={chartConfig.maxHeartRate.color}
                            fillOpacity={0.3}
                        />
                        <ChartLegend
                            content={({ payload }) => {
                                if (payload && payload.length) {
                                    return <ChartLegendContent payload={payload} />;
                                }

                                return null;
                            }}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    {Math.abs(heartRateTrend).toFixed(1)}%{" "}
                    {heartRateTrend > 0 ? "wzrost" : "spadek"} średniego tętna od pierwszego
                    treningu <TrendIcon className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    Pokazuje średnią kroczącą tętna dla wszystkich treningów do danego momentu
                </div>
            </CardFooter>
        </Card>
    );
}
