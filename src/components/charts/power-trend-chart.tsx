"use client";

import * as React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ChartExportActions } from "@/components/charts/chart-export-actions";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import date from "@/lib/date";
import { Training } from "@/types/training";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
    power: {
        label: "Średnia moc (W)",
        color: "#8b5cf6",
    },
};

function calculateNullableMovingAverage(
    data: Array<number | null | undefined>,
    windowSize: number = 5,
): Array<number | null> {
    const result: Array<number | null> = [];
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - windowSize + 1);
        const window = data.slice(start, i + 1).filter((value): value is number => {
            return value !== null && value !== undefined;
        });
        if (window.length === 0) {
            result.push(null);
            continue;
        }
        const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
        result.push(avg);
    }
    return result;
}

export function PowerTrendChart({ trainings }: { trainings: Training[] }) {
    const chartRef = React.useRef<HTMLDivElement>(null);
    const sortedTrainings = [...trainings].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const powers = sortedTrainings.map(t => t.avg_power_watts ?? null);
    const powerMA = calculateNullableMovingAverage(powers, 5);

    const data = sortedTrainings.map((training, index) => ({
        date: training.date,
        formattedDate: date(training.date).format("MMM YY"),
        power: powerMA[index] !== null ? Number(powerMA[index].toFixed(0)) : null,
    }));

    if (!powerMA.some(value => value !== null)) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Moc w czasie</CardTitle>
                    <CardDescription>Średnia krocząca mocy (5 treningów)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-muted-foreground flex h-80 items-center justify-center">
                        Brak danych mocy do wyświetlenia
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <CardTitle>Moc w czasie</CardTitle>
                    <CardDescription>Średnia krocząca mocy (5 treningów)</CardDescription>
                </div>
                <ChartExportActions targetRef={chartRef} fileName="moc-w-czasie" />
            </CardHeader>
            <CardContent>
                <div ref={chartRef} className="w-full">
                    <ChartContainer config={chartConfig} className="aspect-[4/3] w-full">
                        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="formattedDate" tickLine={false} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} />
                            <ChartTooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;

                                    return (
                                        <ChartTooltipContent
                                            className="w-[220px]"
                                            payload={payload
                                                .filter(p => p.value !== null)
                                                .map(p => ({
                                                    ...p,
                                                    value: `${Number(p.value).toFixed(0)} W`,
                                                    name: chartConfig.power.label,
                                                }))}
                                            active={active}
                                        />
                                    );
                                }}
                            />
                            <Line
                                name="power"
                                type="monotone"
                                dataKey="power"
                                stroke={chartConfig.power.color}
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                            />
                        </LineChart>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    );
}
