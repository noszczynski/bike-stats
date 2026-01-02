"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrackpoints } from "@/hooks/use-training-queries";
import { Gauge } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import date from "../../lib/date";

interface FitSpeedChartProps {
    trainingId: string;
}

const chartConfig = {
    speed: {
        label: "Prędkość",
        color: "#3B82F6",
    },
} satisfies ChartConfig;

export function FitSpeedChart({ trainingId }: FitSpeedChartProps) {
    const { data, isLoading, error } = useTrackpoints(trainingId);

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gauge className="h-5 w-5" />
                        Prędkość w czasie (FIT)
                    </CardTitle>
                    <CardDescription>Szczegółowy wykres prędkości z danych .FIT</CardDescription>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gauge className="h-5 w-5" />
                        Prędkość w czasie (FIT)
                    </CardTitle>
                    <CardDescription>Szczegółowy wykres prędkości z danych .FIT</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-muted-foreground py-8 text-center">
                        Błąd: {error.message}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const trackpoints = data?.trackpoints || [];

    const speedData = trackpoints
        .filter(tp => tp.speed_ms && tp.speed_ms > 0)
        .map((tp, index) => ({
            index,
            timestamp: tp.timestamp ? date(tp.timestamp).toISOString() : null,
            speed: tp.speed_ms ? (tp.speed_ms * 3.6).toFixed(1) : null, // Convert m/s to km/h
            distance: tp.distance_m ? (tp.distance_m / 1000).toFixed(1) : null,
            timeFormatted: tp.timestamp ? date(tp.timestamp).format("HH:mm") : null,
        }))
        .map(d => ({
            ...d,
            speed: d.speed ? parseFloat(d.speed) : null,
        }));

    if (speedData.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gauge className="h-5 w-5" />
                        Prędkość w czasie (FIT)
                    </CardTitle>
                    <CardDescription>Szczegółowy wykres prędkości z danych .FIT</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-muted-foreground py-8 text-center">
                        Brak danych prędkości w pliku .FIT
                    </div>
                </CardContent>
            </Card>
        );
    }

    const avgSpeed =
        speedData.reduce((sum, data) => sum + (data.speed || 0), 0) / speedData.length;
    const maxSpeed = Math.max(...speedData.map(data => data.speed || 0));
    const minSpeed = Math.min(...speedData.map(data => data.speed || 0));

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    Prędkość w czasie (FIT)
                </CardTitle>
                <CardDescription>
                    Średnia: {avgSpeed.toFixed(1)} km/h • Max: {maxSpeed.toFixed(1)} km/h • Min:{" "}
                    {minSpeed.toFixed(1)} km/h
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={speedData}
                            margin={{
                                top: 5,
                                right: 10,
                                left: 10,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="timeFormatted"
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                domain={[
                                    (dataMin: number) => Math.max(0, dataMin - 5),
                                    (dataMax: number) => dataMax + 5,
                                ]}
                                label={{ value: "Prędkość (km/h)", angle: -90, position: "insideLeft" }}
                            />
                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(value, payload) => {
                                            if (payload && payload[0]) {
                                                const data = payload[0].payload;

                                                return `Czas: ${data.timeFormatted} • Dystans: ${data.distance} km`;
                                            }

                                            return value;
                                        }}
                                        formatter={(value, name) => {
                                            if (name === "speed") {
                                                return [`${value?.toFixed(1)} km/h`, "Prędkość"];
                                            }

                                            return [value, name];
                                        }}
                                    />
                                }
                            />
                            <Line
                                type="monotone"
                                dataKey="speed"
                                stroke="var(--color-speed)"
                                strokeWidth={2}
                                dot={false}
                                name="Prędkość"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

