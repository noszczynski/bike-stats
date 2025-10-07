"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import date from "@/lib/date";
import { Training } from "@/types/training";
import { InfoIcon, TrendingUpIcon } from "lucide-react";
import { CartesianGrid, Legend, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts";

const chartConfig = {
    volume: {
        label: "Dystans (km)",
        color: "#3b82f6",
    },
    intensity: {
        label: "Intensywność",
        color: "#ef4444",
    },
};

export function VolumeIntensityChart({ trainings }: { trainings: Training[] }) {
    // Prepare data for scatter plot
    const data = trainings.map(training => {
        // Calculate intensity score based on heart rate and effort
        let intensity = 0;

        if (training.avg_heart_rate_bpm) {
            // Normalize heart rate (assuming max 190)
            intensity += (training.avg_heart_rate_bpm / 190) * 50;
        }

        if (training.effort) {
            intensity += (training.effort / 10) * 30;
        }

        // Speed component
        intensity += (training.avg_speed_kmh / 35) * 20; // Assuming 35 km/h as reference

        return {
            volume: Number(training.distance_km.toFixed(1)),
            intensity: Number(intensity.toFixed(1)),
            name: training.name,
            date: date(training.date).format("DD MMM YYYY"),
            elevation: training.elevation_gain_m,
            avgSpeed: training.avg_speed_kmh,
            avgHR: training.avg_heart_rate_bpm,
        };
    });

    // Calculate sweet spot (optimal zone)
    const avgVolume = data.reduce((sum, d) => sum + d.volume, 0) / data.length;
    const avgIntensity = data.reduce((sum, d) => sum + d.intensity, 0) / data.length;

    // Find trainings in sweet spot (within 20% of average)
    const sweetSpotCount = data.filter(
        d =>
            d.volume >= avgVolume * 0.8 &&
            d.volume <= avgVolume * 1.2 &&
            d.intensity >= avgIntensity * 0.8 &&
            d.intensity <= avgIntensity * 1.2,
    ).length;

    // Categorize trainings
    const highVolumeHighIntensity = data.filter(
        d => d.volume > avgVolume && d.intensity > avgIntensity,
    ).length;
    const highVolumeLowIntensity = data.filter(
        d => d.volume > avgVolume && d.intensity <= avgIntensity,
    ).length;
    const lowVolumeHighIntensity = data.filter(
        d => d.volume <= avgVolume && d.intensity > avgIntensity,
    ).length;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CardTitle>Objętość vs Intensywność</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <InfoIcon className="text-muted-foreground h-4 w-4" />
                            </TooltipTrigger>
                            <TooltipContent className="w-[350px]">
                                <p className="mb-2 font-semibold">Analiza relacji:</p>
                                <ul className="space-y-1 text-sm">
                                    <li>
                                        <strong>Objętość</strong> - dystans treningu (km)
                                    </li>
                                    <li>
                                        <strong>Intensywność</strong> - wskaźnik oparty na tętnie,
                                        prędkości i wysiłku
                                    </li>
                                    <li>
                                        <strong>Sweet spot</strong> - strefy zbliżone do średnich
                                        wartości
                                    </li>
                                </ul>
                                <p className="mt-2 text-sm">
                                    Wykres pomaga zidentyfikować, czy preferujesz długie spokojne
                                    jazdy czy krótkie intensywne treningi.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <CardDescription>
                    Relacja między dystansem a intensywnością treningów
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-auto h-80">
                    <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            type="number"
                            dataKey="volume"
                            name="Dystans"
                            unit=" km"
                            label={{ value: "Dystans (km)", position: "bottom" }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            type="number"
                            dataKey="intensity"
                            name="Intensywność"
                            label={{ value: "Intensywność", angle: -90, position: "insideLeft" }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <ZAxis range={[50, 400]} />
                        <ChartTooltip
                            cursor={{ strokeDasharray: "3 3" }}
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;

                                const data = payload[0].payload;

                                return (
                                    <div className="bg-background rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">{data.name}</p>
                                            <p className="text-muted-foreground text-xs">
                                                {data.date}
                                            </p>
                                            <div className="mt-2 space-y-1 text-xs">
                                                <p>
                                                    Dystans:{" "}
                                                    <span className="font-medium">
                                                        {data.volume} km
                                                    </span>
                                                </p>
                                                <p>
                                                    Intensywność:{" "}
                                                    <span className="font-medium">
                                                        {data.intensity.toFixed(0)}
                                                    </span>
                                                </p>
                                                <p>
                                                    Prędkość:{" "}
                                                    <span className="font-medium">
                                                        {data.avgSpeed.toFixed(1)} km/h
                                                    </span>
                                                </p>
                                                {data.avgHR && (
                                                    <p>
                                                        Tętno:{" "}
                                                        <span className="font-medium">
                                                            {data.avgHR} bpm
                                                        </span>
                                                    </p>
                                                )}
                                                <p>
                                                    Przewyższenie:{" "}
                                                    <span className="font-medium">
                                                        {data.elevation} m
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }}
                        />
                        <Scatter
                            name="Treningi"
                            data={data}
                            fill={chartConfig.volume.color}
                            fillOpacity={0.6}
                        />
                        {/* Reference lines for sweet spot */}
                        <line
                            x1={0}
                            y1={avgIntensity}
                            x2="100%"
                            y2={avgIntensity}
                            stroke="#94a3b8"
                            strokeWidth={1}
                            strokeDasharray="5 5"
                        />
                        <line
                            x1={avgVolume}
                            y1={0}
                            x2={avgVolume}
                            y2="100%"
                            stroke="#94a3b8"
                            strokeWidth={1}
                            strokeDasharray="5 5"
                        />
                    </ScatterChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    <TrendingUpIcon className="h-4 w-4" />
                    Sweet spot: {sweetSpotCount} treningów (
                    {((sweetSpotCount / data.length) * 100).toFixed(0)}%)
                </div>
                <div className="text-muted-foreground leading-none">
                    Wysoka objętość + intensywność: {highVolumeHighIntensity} | Wysoka objętość:{" "}
                    {highVolumeLowIntensity} | Wysoka intensywność: {lowVolumeHighIntensity}
                </div>
            </CardFooter>
        </Card>
    );
}
