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
import { Zap } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import date from "../../lib/date";

interface FitPowerChartProps {
    trainingId: string;
}

const chartConfig = {
    power: {
        label: "Moc",
        color: "#8B5CF6",
    },
} satisfies ChartConfig;

export function FitPowerChart({ trainingId }: FitPowerChartProps) {
    const { data, isLoading, error } = useTrackpoints(trainingId);

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Moc w czasie (FIT)
                    </CardTitle>
                    <CardDescription>Szczegółowy wykres mocy z danych .FIT</CardDescription>
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
                        <Zap className="h-5 w-5" />
                        Moc w czasie (FIT)
                    </CardTitle>
                    <CardDescription>Szczegółowy wykres mocy z danych .FIT</CardDescription>
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

    const powerData = trackpoints
        .filter(tp => tp.power && tp.power > 0)
        .map((tp, index) => ({
            index,
            timestamp: tp.timestamp ? date(tp.timestamp).toISOString() : null,
            power: tp.power ?? null,
            distance: tp.distance ? (tp.distance / 1000).toFixed(1) : null,
            timeFormatted: tp.timestamp ? date(tp.timestamp).format("HH:mm") : null,
        }));

    if (powerData.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Moc w czasie (FIT)
                    </CardTitle>
                    <CardDescription>Szczegółowy wykres mocy z danych .FIT</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-muted-foreground py-8 text-center">
                        Brak danych mocy w pliku .FIT
                    </div>
                </CardContent>
            </Card>
        );
    }

    const avgPower =
        powerData.reduce((sum, data) => sum + (data.power || 0), 0) / powerData.length;
    const maxPower = Math.max(...powerData.map(data => data.power || 0));
    const minPower = Math.min(...powerData.map(data => data.power || 0));

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Moc w czasie (FIT)
                </CardTitle>
                <CardDescription>
                    Średnia: {avgPower.toFixed(0)}W • Max: {maxPower.toFixed(0)}W • Min:{" "}
                    {minPower.toFixed(0)}W
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={powerData}
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
                                            if (name === "power") {
                                                return [`${value} W`, "Moc"];
                                            }

                                            return [value, name];
                                        }}
                                    />
                                }
                            />
                            <Line
                                type="monotone"
                                dataKey="power"
                                stroke="var(--color-power)"
                                strokeWidth={2}
                                dot={false}
                                name="Moc"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

