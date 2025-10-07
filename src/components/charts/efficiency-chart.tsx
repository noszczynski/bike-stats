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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import date from "@/lib/date";
import { Training } from "@/types/training";
import { InfoIcon, TrendingDownIcon, TrendingUpIcon, ZapIcon } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
    efficiency: {
        label: "Efficiency Factor",
        color: "#10b981",
    },
    vam: {
        label: "VAM (m/h)",
        color: "#f59e0b",
    },
    speedPerHR: {
        label: "Prędkość/Tętno",
        color: "#3b82f6",
    },
};

// Calculate VAM (Vertical Ascent Meters per hour)
function calculateVAM(elevationGain: number, movingTime: string): number {
    const [hours, minutes, seconds] = movingTime.split(":").map(Number);
    const totalHours = hours + minutes / 60 + seconds / 3600;
    return totalHours > 0 ? elevationGain / totalHours : 0;
}

// Calculate Efficiency Factor (Speed / HR ratio)
function calculateEfficiencyFactor(speed: number, avgHR: number | null | undefined): number {
    if (!avgHR || avgHR === 0) return 0;
    return speed / avgHR;
}

export function EfficiencyChart({ trainings }: { trainings: Training[] }) {
    // Sort trainings by date
    const sortedTrainings = [...trainings].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Calculate efficiency metrics
    const data = sortedTrainings.map((training, index) => {
        const vam = calculateVAM(training.elevation_gain_m, training.moving_time);
        const efficiency = calculateEfficiencyFactor(
            training.avg_speed_kmh,
            training.avg_heart_rate_bpm,
        );
        const speedPerHR = training.avg_heart_rate_bpm
            ? training.avg_speed_kmh / training.avg_heart_rate_bpm
            : 0;

        return {
            date: training.date,
            formattedDate: date(training.date).format("DD MMM YY"),
            efficiency: Number((efficiency * 100).toFixed(2)),
            vam: Number(vam.toFixed(0)),
            speedPerHR: Number((speedPerHR * 100).toFixed(2)),
            name: training.name,
            distance: training.distance_km,
            elevation: training.elevation_gain_m,
        };
    });

    // Filter out entries with no heart rate data for efficiency metrics
    const validEfficiencyData = data.filter(d => d.efficiency > 0);

    // Calculate moving averages for efficiency
    const efficiencyMA = validEfficiencyData.map((d, i, arr) => {
        const windowSize = 5;
        const start = Math.max(0, i - windowSize + 1);
        const window = arr.slice(start, i + 1);
        const avg = window.reduce((sum, val) => sum + val.efficiency, 0) / window.length;
        return {
            ...d,
            efficiencyMA: Number(avg.toFixed(2)),
        };
    });

    // Calculate trends
    const segment = Math.floor(efficiencyMA.length * 0.2);
    const firstSegment = efficiencyMA.slice(0, segment);
    const lastSegment = efficiencyMA.slice(-segment);

    const efficiencyTrend = firstSegment.length
        ? ((lastSegment.reduce((sum, d) => sum + d.efficiencyMA, 0) / lastSegment.length -
              firstSegment.reduce((sum, d) => sum + d.efficiencyMA, 0) / firstSegment.length) /
              (firstSegment.reduce((sum, d) => sum + d.efficiencyMA, 0) / firstSegment.length)) *
          100
        : 0;

    const TrendIcon = efficiencyTrend > 0 ? TrendingUpIcon : TrendingDownIcon;

    // Calculate average VAM
    const avgVAM =
        validEfficiencyData.reduce((sum, d) => sum + d.vam, 0) / validEfficiencyData.length || 0;

    // VAM benchmarks
    const vamBenchmark =
        avgVAM > 1200
            ? "Profesjonalny poziom"
            : avgVAM > 900
              ? "Bardzo dobry"
              : avgVAM > 700
                ? "Dobry"
                : "Rekreacyjny";

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CardTitle>Efektywność treningu</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <InfoIcon className="text-muted-foreground h-4 w-4" />
                            </TooltipTrigger>
                            <TooltipContent className="w-[350px]">
                                <p className="mb-2 font-semibold">Metryki efektywności:</p>
                                <ul className="space-y-1 text-sm">
                                    <li>
                                        <strong>Efficiency Factor</strong> - Stosunek prędkości do
                                        tętna (wyższa = lepiej)
                                    </li>
                                    <li>
                                        <strong>VAM</strong> - Vertical Ascent Meters: metry w
                                        pionie na godzinę
                                    </li>
                                    <li>
                                        <strong>Speed/HR</strong> - Jak szybko jedziesz przy danym
                                        tętnie
                                    </li>
                                </ul>
                                <p className="mt-2 text-sm">
                                    <strong>VAM benchmark:</strong> &lt;700=rekreacyjny,
                                    700-900=dobry, 900-1200=b.dobry, &gt;1200=pro
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <CardDescription>
                    Efficiency Factor, VAM i stosunek prędkości do tętna
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {/* Efficiency Factor chart */}
                    <div>
                        <h4 className="mb-4 text-sm font-medium">
                            Efficiency Factor (średnia krocząca)
                        </h4>
                        <ChartContainer config={chartConfig} className="aspect-auto h-60">
                            <LineChart
                                data={efficiencyMA}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="formattedDate" tickLine={false} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} />
                                <ChartTooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;

                                        const data = payload[0].payload;

                                        return (
                                            <div className="bg-background rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">
                                                        {data.name}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {date(data.date).format("DD MMM YYYY")}
                                                    </p>
                                                    <div className="mt-2 space-y-1 text-xs">
                                                        <p>
                                                            EF (MA):{" "}
                                                            <span className="font-medium">
                                                                {data.efficiencyMA.toFixed(2)}
                                                            </span>
                                                        </p>
                                                        <p>
                                                            EF:{" "}
                                                            <span className="font-medium">
                                                                {data.efficiency.toFixed(2)}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                                <Line
                                    name="efficiency"
                                    type="monotone"
                                    dataKey="efficiencyMA"
                                    stroke={chartConfig.efficiency.color}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ChartContainer>
                    </div>

                    {/* VAM chart */}
                    <div>
                        <h4 className="mb-4 text-sm font-medium">
                            VAM - Vertical Ascent Meters (m/h)
                        </h4>
                        <ChartContainer config={chartConfig} className="aspect-auto h-60">
                            <AreaChart
                                data={validEfficiencyData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="formattedDate" tickLine={false} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} />
                                <ChartTooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;

                                        const data = payload[0].payload;

                                        return (
                                            <div className="bg-background rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">
                                                        {data.name}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {date(data.date).format("DD MMM YYYY")}
                                                    </p>
                                                    <div className="mt-2 space-y-1 text-xs">
                                                        <p>
                                                            VAM:{" "}
                                                            <span className="font-medium">
                                                                {data.vam} m/h
                                                            </span>
                                                        </p>
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
                                <Area
                                    name="vam"
                                    type="monotone"
                                    dataKey="vam"
                                    fill={chartConfig.vam.color}
                                    stroke={chartConfig.vam.color}
                                    fillOpacity={0.3}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    <ZapIcon className="h-4 w-4" />
                    Efficiency Factor: {Math.abs(efficiencyTrend).toFixed(1)}%{" "}
                    {efficiencyTrend > 0 ? "wzrost" : "spadek"} <TrendIcon className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    Średni VAM: {avgVAM.toFixed(0)} m/h ({vamBenchmark})
                </div>
            </CardFooter>
        </Card>
    );
}
