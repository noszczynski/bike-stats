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
    elevation: {
        label: "Średnie przewyższenie (m)",
        color: "#ef4444",
    },
    elevationPerKm: {
        label: "Średnie przewyższenie na km",
        color: "#4f46e5",
    },
};

export function ElevationChart({ trainings }: { trainings: Training[] }) {
    // Sort trainings by date
    const sortedTrainings = [...trainings].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Calculate moving averages
    const data = sortedTrainings.map((training, index) => {
        // Get all trainings up to current index (inclusive)
        const trainingsToAverage = sortedTrainings.slice(0, index + 1);

        // Calculate average elevation
        const avgElevation =
            trainingsToAverage.reduce((sum, t) => sum + t.elevation_gain_m, 0) /
            trainingsToAverage.length;

        // Calculate average elevation per km
        const totalElevation = trainingsToAverage.reduce((sum, t) => sum + t.elevation_gain_m, 0);
        const totalDistance = trainingsToAverage.reduce((sum, t) => sum + t.distance_km, 0);
        const avgElevationPerKm = totalElevation / totalDistance;

        return {
            date: training.date,
            formattedDate: date(training.date).format("LL"),
            elevation: Number(avgElevation.toFixed(1)),
            elevationPerKm: Number(avgElevationPerKm.toFixed(1)),
        };
    });

    // Calculate progress for elevation
    const firstElevation = data[0]?.elevation || 0;
    const lastElevation = data[data.length - 1]?.elevation || 0;
    const elevationProgress = ((lastElevation - firstElevation) / firstElevation) * 100;

    const TrendIcon = elevationProgress > 0 ? TrendingUpIcon : TrendingDownIcon;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Przewyższenie w czasie</CardTitle>
                <CardDescription>
                    Średnie przewyższenie i średnie przewyższenie na kilometr
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
                            label={{ value: "m", angle: -90, position: "insideLeft" }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            label={{ value: "m/km", angle: 90, position: "insideRight" }}
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
                                                p.name === "elevation"
                                                    ? "elevation"
                                                    : "elevationPerKm";

                                            return {
                                                ...p,
                                                value: `${p.value} ${key === "elevation" ? "m" : "m/km"}`,
                                                name: chartConfig[key].label,
                                            };
                                        })}
                                        active={active}
                                    />
                                );
                            }}
                        />
                        <Area
                            name="elevation"
                            type="monotone"
                            dataKey="elevation"
                            yAxisId="left"
                            fill={chartConfig.elevation.color}
                            stroke={chartConfig.elevation.color}
                            fillOpacity={0.3}
                        />
                        <Area
                            name="elevationPerKm"
                            type="monotone"
                            dataKey="elevationPerKm"
                            yAxisId="right"
                            fill={chartConfig.elevationPerKm.color}
                            stroke={chartConfig.elevationPerKm.color}
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
                    {Math.abs(elevationProgress).toFixed(1)}%{" "}
                    {elevationProgress > 0 ? "wzrost" : "spadek"} średniego przewyższenia od
                    pierwszego treningu <TrendIcon className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    Pokazuje średnie przewyższenie i średnie przewyższenie na kilometr dla
                    wszystkich treningów do danego momentu
                </div>
            </CardFooter>
        </Card>
    );
}
