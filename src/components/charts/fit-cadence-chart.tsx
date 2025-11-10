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

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CircleDot className="h-5 w-5" />
                        Kadencja w czasie (FIT)
                    </CardTitle>
                    <CardDescription>Szczegółowy wykres kadencji z danych .FIT</CardDescription>
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
                        <CircleDot className="h-5 w-5" />
                        Kadencja w czasie (FIT)
                    </CardTitle>
                    <CardDescription>Szczegółowy wykres kadencji z danych .FIT</CardDescription>
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

    const cadenceData = trackpoints
        .filter(tp => tp.cadence && tp.cadence > 0)
        .map((tp, index) => ({
            index,
            timestamp: tp.timestamp ? date(tp.timestamp).toISOString() : null,
            cadence: tp.cadence ?? null,
            distance: tp.distance ? (tp.distance / 1000).toFixed(1) : null,
            timeFormatted: tp.timestamp ? date(tp.timestamp).format("HH:mm") : null,
        }));

    if (cadenceData.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CircleDot className="h-5 w-5" />
                        Kadencja w czasie (FIT)
                    </CardTitle>
                    <CardDescription>Szczegółowy wykres kadencji z danych .FIT</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-muted-foreground py-8 text-center">
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
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CircleDot className="h-5 w-5" />
                    Kadencja w czasie (FIT)
                </CardTitle>
                <CardDescription>
                    Średnia: {avgCadence.toFixed(0)} RPM • Max: {maxCadence.toFixed(0)} RPM • Min:{" "}
                    {minCadence.toFixed(0)} RPM
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
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
                                domain={[
                                    (dataMin: number) => Math.max(0, dataMin - 10),
                                    (dataMax: number) => dataMax + 10,
                                ]}
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
            </CardContent>
        </Card>
    );
}

