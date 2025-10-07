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
    distance: {
        label: "Średni dystans (km)",
        color: "#ef4444",
    },
    cumulativeDistance: {
        label: "Łączny dystans (km)",
        color: "#4f46e5",
    },
};

export function DistanceChart({ trainings }: { trainings: Training[] }) {
    // Sort trainings by date
    const sortedTrainings = [...trainings].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Calculate moving average and cumulative distance
    const data = sortedTrainings.map((training, index) => {
        // Get all trainings up to current index (inclusive)
        const trainingsToAverage = sortedTrainings.slice(0, index + 1);

        // Calculate average distance
        const avgDistance =
            trainingsToAverage.reduce((sum, t) => sum + t.distance_km, 0) /
            trainingsToAverage.length;

        // Calculate cumulative distance
        const cumulativeDistance = trainingsToAverage.reduce((sum, t) => sum + t.distance_km, 0);

        return {
            date: training.date,
            formattedDate: date(training.date).format("MMM YYYY"),
            distance: Number(avgDistance.toFixed(1)),
            cumulativeDistance: Number(cumulativeDistance.toFixed(1)),
        };
    });

    // Calculate progress
    const firstDistance = data[0]?.distance || 0;
    const lastDistance = data[data.length - 1]?.distance || 0;
    const distanceProgress = ((lastDistance - firstDistance) / firstDistance) * 100;

    const TrendIcon = distanceProgress > 0 ? TrendingUpIcon : TrendingDownIcon;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dystans w czasie</CardTitle>
                <CardDescription>
                    Średni dystans treningów i łączny przejechany dystans
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-auto h-80">
                    <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="formattedDate" tickLine={false} axisLine={false} />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            label={{ value: "km (średnia)", angle: -90, position: "insideLeft" }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            label={{ value: "km (łącznie)", angle: 90, position: "insideRight" }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <ChartTooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;

                                return (
                                    <ChartTooltipContent
                                        className="w-[250px]"
                                        payload={payload.map(p => {
                                            const key =
                                                p.name === "distance"
                                                    ? "distance"
                                                    : "cumulativeDistance";

                                            return {
                                                ...p,
                                                value: `${p.value} km`,
                                                name: chartConfig[key].label,
                                            };
                                        })}
                                        active={active}
                                    />
                                );
                            }}
                        />
                        <Area
                            name="distance"
                            type="monotone"
                            dataKey="distance"
                            yAxisId="left"
                            fill={chartConfig.distance.color}
                            stroke={chartConfig.distance.color}
                            fillOpacity={0.3}
                        />
                        <Area
                            name="cumulativeDistance"
                            type="monotone"
                            dataKey="cumulativeDistance"
                            yAxisId="right"
                            fill={chartConfig.cumulativeDistance.color}
                            stroke={chartConfig.cumulativeDistance.color}
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
                    {Math.abs(distanceProgress).toFixed(1)}%{" "}
                    {distanceProgress > 0 ? "wzrost" : "spadek"} średniego dystansu od pierwszego
                    treningu <TrendIcon className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    Pokazuje średni dystans i łączny dystans dla wszystkich treningów do danego
                    momentu
                </div>
            </CardFooter>
        </Card>
    );
}
