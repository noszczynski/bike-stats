"use client";

import * as React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ChartExportActions } from "@/components/charts/chart-export-actions";
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
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
    speed: {
        label: "Średnia prędkość (km/h)",
        color: "#3b82f6",
    },
    distance: {
        label: "Średni dystans (km)",
        color: "#10b981",
    },
    elevation: {
        label: "Średnie przewyższenie (m)",
        color: "#f59e0b",
    },
    heartRate: {
        label: "Średnie tętno (bpm)",
        color: "#ef4444",
    },
    power: {
        label: "Średnia moc (W)",
        color: "#8b5cf6",
    },
};

// Calculate moving average
function calculateMovingAverage(data: number[], windowSize: number = 5): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - windowSize + 1);
        const window = data.slice(start, i + 1);
        const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
        result.push(avg);
    }
    return result;
}

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

export function ProgressionTrendsChart({ trainings }: { trainings: Training[] }) {
    const chartRef = React.useRef<HTMLDivElement>(null);
    // Sort trainings by date
    const sortedTrainings = [...trainings].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Extract raw values
    const speeds = sortedTrainings.map(t => t.avg_speed_kmh);
    const distances = sortedTrainings.map(t => t.distance_km);
    const elevations = sortedTrainings.map(t => t.elevation_gain_m);
    const powers = sortedTrainings.map(t => t.avg_power_watts ?? null);
    const heartRates = sortedTrainings
        .map(t => t.avg_heart_rate_bpm)
        .filter((hr): hr is number => hr !== null && hr !== undefined);

    // Calculate moving averages
    const speedMA = calculateMovingAverage(speeds, 5);
    const distanceMA = calculateMovingAverage(distances, 5);
    const elevationMA = calculateMovingAverage(elevations, 5);
    const powerMA = calculateNullableMovingAverage(powers, 5);

    // For heart rate, calculate MA only for trainings with HR data
    const hrIndices: number[] = [];
    sortedTrainings.forEach((t, i) => {
        if (t.avg_heart_rate_bpm) hrIndices.push(i);
    });

    const data = sortedTrainings.map((training, index) => {
        return {
            date: training.date,
            formattedDate: date(training.date).format("MMM YY"),
            speed: Number(speedMA[index].toFixed(1)),
            distance: Number(distanceMA[index].toFixed(1)),
            elevation: Number(elevationMA[index].toFixed(0)),
            heartRate: training.avg_heart_rate_bpm || null,
            power: powerMA[index] !== null ? Number(powerMA[index].toFixed(0)) : null,
        };
    });

    // Calculate trends (compare first 20% with last 20%)
    const segment = Math.floor(data.length * 0.2);
    const firstSegment = data.slice(0, segment);
    const lastSegment = data.slice(-segment);

    const speedTrend =
        ((lastSegment.reduce((sum, d) => sum + d.speed, 0) / lastSegment.length -
            firstSegment.reduce((sum, d) => sum + d.speed, 0) / firstSegment.length) /
            (firstSegment.reduce((sum, d) => sum + d.speed, 0) / firstSegment.length)) *
        100;

    const distanceTrend =
        ((lastSegment.reduce((sum, d) => sum + d.distance, 0) / lastSegment.length -
            firstSegment.reduce((sum, d) => sum + d.distance, 0) / firstSegment.length) /
            (firstSegment.reduce((sum, d) => sum + d.distance, 0) / firstSegment.length)) *
        100;

    const TrendIcon = speedTrend > 0 ? TrendingUpIcon : TrendingDownIcon;

    return (
        <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <CardTitle>Progresja i trendy</CardTitle>
                    <CardDescription>
                        Średnie kroczące (5 treningów) - śledź swoją poprawę w czasie
                    </CardDescription>
                </div>
                <ChartExportActions targetRef={chartRef} fileName="progresja-i-trendy" />
            </CardHeader>
            <CardContent>
                <div ref={chartRef} className="w-full">
                    <ChartContainer config={chartConfig} className="aspect-[4/3] w-full">
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="formattedDate" tickLine={false} axisLine={false} />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickLine={false}
                            axisLine={false}
                        />
                        <ChartTooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;

                                return (
                                    <ChartTooltipContent
                                        className="w-[250px]"
                                        payload={payload
                                            .filter(p => p.value !== null)
                                            .map(p => {
                                                const key = p.name as keyof typeof chartConfig;
                                                const value = p.value;
                                                let formattedValue = value;

                                                if (key === "speed") {
                                                    formattedValue = `${Number(value).toFixed(1)} km/h`;
                                                } else if (key === "distance") {
                                                    formattedValue = `${Number(value).toFixed(1)} km`;
                                                } else if (key === "elevation") {
                                                    formattedValue = `${Number(value).toFixed(0)} m`;
                                                } else if (key === "heartRate") {
                                                    formattedValue = `${Number(value).toFixed(0)} bpm`;
                                                } else if (key === "power") {
                                                    formattedValue = `${Number(value).toFixed(0)} W`;
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
                            name="speed"
                            type="monotone"
                            dataKey="speed"
                            yAxisId="left"
                            stroke={chartConfig.speed.color}
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            name="distance"
                            type="monotone"
                            dataKey="distance"
                            yAxisId="left"
                            stroke={chartConfig.distance.color}
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            name="elevation"
                            type="monotone"
                            dataKey="elevation"
                            yAxisId="right"
                            stroke={chartConfig.elevation.color}
                            strokeWidth={2}
                            dot={false}
                        />
                        {heartRates.length > 0 && (
                            <Line
                                name="heartRate"
                                type="monotone"
                                dataKey="heartRate"
                                yAxisId="right"
                                stroke={chartConfig.heartRate.color}
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                            />
                        )}
                        {powerMA.some(value => value !== null) && (
                            <Line
                                name="power"
                                type="monotone"
                                dataKey="power"
                                yAxisId="right"
                                stroke={chartConfig.power.color}
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                            />
                        )}
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
                </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    <TrendIcon className="h-4 w-4" />
                    Prędkość: {Math.abs(speedTrend).toFixed(1)}%{" "}
                    {speedTrend > 0 ? "wzrost" : "spadek"}
                </div>
                <div className="text-muted-foreground leading-none">
                    Dystans: {Math.abs(distanceTrend).toFixed(1)}%{" "}
                    {distanceTrend > 0 ? "wzrost" : "spadek"} • Porównanie pierwszych 20% z
                    ostatnimi 20% treningów
                </div>
            </CardFooter>
        </Card>
    );
}
