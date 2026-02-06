"use client";

import * as React from "react";

import { ChartExportActions } from "@/components/charts/chart-export-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrackpoints } from "@/hooks/use-training-queries";
import { CircleDot } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import date from "../../lib/date";

interface FitCadenceChartProps {
    trainingId: string;
}

const chartConfig = {
    cadence: {
        label: "Kadencja",
        color: "#10B981",
    },
} satisfies ChartConfig;

export function FitCadenceChart({ trainingId }: FitCadenceChartProps) {
    const { data, isLoading, error } = useTrackpoints(trainingId);
    const chartRef = React.useRef<HTMLDivElement>(null);

    if (isLoading) {
        return (
            <Card className="w-full aspect-[4/3] flex flex-col">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <CircleDot className="h-5 w-5" />
                        Kadencja w czasie (FIT)
                    </CardTitle>
                    <div className="flex flex-col gap-2 sm:items-end">
                        <CardDescription>Szczegółowy wykres kadencji z danych .FIT</CardDescription>
                        <ChartExportActions
                            targetRef={chartRef}
                            fileName="kadencja-w-czasie"
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1">
                    <div ref={chartRef} className="h-full w-full">
                        <Skeleton className="h-full w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full aspect-[4/3] flex flex-col">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <CircleDot className="h-5 w-5" />
                        Kadencja w czasie (FIT)
                    </CardTitle>
                    <div className="flex flex-col gap-2 sm:items-end">
                        <CardDescription>Szczegółowy wykres kadencji z danych .FIT</CardDescription>
                        <ChartExportActions
                            targetRef={chartRef}
                            fileName="kadencja-w-czasie"
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1">
                    <div className="text-muted-foreground flex h-full items-center justify-center text-center">
                        Błąd: {error.message}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const trackpoints = data?.trackpoints || [];

    const cadenceData = trackpoints
        .filter(tp => tp.cadence_rpm && tp.cadence_rpm > 0)
        .map((tp, index) => ({
            index,
            timestamp: tp.timestamp ? date(tp.timestamp).toISOString() : null,
            cadence: tp.cadence_rpm ?? null,
            distance: tp.distance_m ? (tp.distance_m / 1000).toFixed(1) : null,
            timeFormatted: tp.timestamp ? date(tp.timestamp).format("HH:mm") : null,
        }));

    if (cadenceData.length === 0) {
        return (
            <Card className="w-full aspect-[4/3] flex flex-col">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <CircleDot className="h-5 w-5" />
                        Kadencja w czasie (FIT)
                    </CardTitle>
                    <div className="flex flex-col gap-2 sm:items-end">
                        <CardDescription>Szczegółowy wykres kadencji z danych .FIT</CardDescription>
                        <ChartExportActions
                            targetRef={chartRef}
                            fileName="kadencja-w-czasie"
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1">
                    <div className="text-muted-foreground flex h-full items-center justify-center text-center">
                        Brak danych kadencji w pliku .FIT
                    </div>
                </CardContent>
            </Card>
        );
    }

    const avgCadence =
        cadenceData.reduce((sum, data) => sum + (data.cadence || 0), 0) / cadenceData.length;
    const maxCadence = Math.max(...cadenceData.map(data => data.cadence || 0));
    const minCadence = Math.min(...cadenceData.map(data => data.cadence || 0));

    return (
        <Card className="w-full aspect-[4/3] flex flex-col">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                    <CircleDot className="h-5 w-5" />
                    Kadencja w czasie (FIT)
                </CardTitle>
                <div className="flex flex-col gap-2 sm:items-end">
                    <CardDescription>
                        Średnia: {avgCadence.toFixed(0)} RPM • Max: {maxCadence.toFixed(0)} RPM •
                        Min: {minCadence.toFixed(0)} RPM
                    </CardDescription>
                    <ChartExportActions targetRef={chartRef} fileName="kadencja-w-czasie" />
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <div ref={chartRef} className="h-full w-full">
                    <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={cadenceData}
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
                                    domain={[0, 160]}
                                    ticks={[0, 20, 40, 60, 80, 100, 120, 140, 160]}
                                    label={{
                                        value: "Kadencja (RPM)",
                                        angle: -90,
                                        position: "insideLeft",
                                    }}
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
                                                if (name === "cadence") {
                                                    return [`${value} RPM`, "Kadencja"];
                                                }

                                                return [value, name];
                                            }}
                                        />
                                    }
                                />
                                <Line
                                    type="monotone"
                                    dataKey="cadence"
                                    stroke="var(--color-cadence)"
                                    strokeWidth={2}
                                    dot={false}
                                    name="Kadencja"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    );
}
