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
import { Mountain } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import date from "../../lib/date";

interface FitElevationChartProps {
    trainingId: string;
}

const chartConfig = {
    elevation: {
        label: "Wysokość",
        color: "#10B981",
    },
} satisfies ChartConfig;

export function FitElevationChart({ trainingId }: FitElevationChartProps) {
    const { data, isLoading, error } = useTrackpoints(trainingId);

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mountain className="h-5 w-5" />
                        Przewyższenie w czasie (FIT)
                    </CardTitle>
                    <CardDescription>Szczegółowy wykres przewyższenia z danych .FIT</CardDescription>
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
                        <Mountain className="h-5 w-5" />
                        Przewyższenie w czasie (FIT)
                    </CardTitle>
                    <CardDescription>Szczegółowy wykres przewyższenia z danych .FIT</CardDescription>
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

    const elevationData = trackpoints
        .filter(tp => tp.altitude_m !== null && tp.altitude_m !== undefined)
        .map((tp, index) => ({
            index,
            timestamp: tp.timestamp ? date(tp.timestamp).toISOString() : null,
            elevation: tp.altitude_m ?? null,
            distance: tp.distance_m ? (tp.distance_m / 1000).toFixed(1) : null,
            timeFormatted: tp.timestamp ? date(tp.timestamp).format("HH:mm") : null,
        }));

    if (elevationData.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mountain className="h-5 w-5" />
                        Przewyższenie w czasie (FIT)
                    </CardTitle>
                    <CardDescription>Szczegółowy wykres przewyższenia z danych .FIT</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-muted-foreground py-8 text-center">
                        Brak danych przewyższenia w pliku .FIT
                    </div>
                </CardContent>
            </Card>
        );
    }

    const elevations = elevationData.map(d => d.elevation || 0);
    const avgElevation = elevations.reduce((sum, val) => sum + val, 0) / elevations.length;
    const maxElevation = Math.max(...elevations);
    const minElevation = Math.min(...elevations);
    const elevationGain = Math.max(...elevations) - Math.min(...elevations);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mountain className="h-5 w-5" />
                    Przewyższenie w czasie (FIT)
                </CardTitle>
                <CardDescription>
                    Średnia: {avgElevation.toFixed(0)} m • Max: {maxElevation.toFixed(0)} m • Min:{" "}
                    {minElevation.toFixed(0)} m • Przewyższenie: {elevationGain.toFixed(0)} m
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={elevationData}
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
                                    (dataMin: number) => Math.max(0, dataMin - 20),
                                    (dataMax: number) => dataMax + 20,
                                ]}
                                label={{ value: "Wysokość (m)", angle: -90, position: "insideLeft" }}
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
                                            if (name === "elevation") {
                                                return [`${value?.toFixed(0)} m`, "Wysokość"];
                                            }

                                            return [value, name];
                                        }}
                                    />
                                }
                            />
                            <Line
                                type="monotone"
                                dataKey="elevation"
                                stroke="var(--color-elevation)"
                                strokeWidth={2}
                                dot={false}
                                name="Wysokość"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

