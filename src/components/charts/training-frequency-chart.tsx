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
import { CalendarIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
    weekly: {
        label: "Treningów tygodniowo",
        color: "#6366f1",
    },
    monthly: {
        label: "Treningów miesięcznie",
        color: "#8b5cf6",
    },
};

export function TrainingFrequencyChart({ trainings }: { trainings: Training[] }) {
    // Sort trainings by date
    const sortedTrainings = [...trainings].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Group by week and month
    const weeklyData: { [key: string]: { count: number; firstDate: string } } = {};
    const monthlyData: { [key: string]: number } = {};

    sortedTrainings.forEach(training => {
        const trainingDate = date(training.date);
        // Get start of week (Monday)
        const weekStart = trainingDate.startOf("week");
        const weekKey = weekStart.format("YYYY-MM-DD");
        const monthKey = trainingDate.format("YYYY-MM");

        if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { count: 0, firstDate: weekKey };
        }
        weeklyData[weekKey].count += 1;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    // Convert to array format for charts
    const weeklyChartData = Object.entries(weeklyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([weekKey, data]) => ({
            period: date(data.firstDate).format("DD MMM YY"),
            count: data.count,
            weekKey,
        }));

    const monthlyChartData = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({
            period: date(month + "-01").format("MMM YYYY"),
            count,
        }));

    // Calculate statistics
    const avgWeekly =
        weeklyChartData.reduce((sum, d) => sum + d.count, 0) / weeklyChartData.length || 0;
    const avgMonthly =
        monthlyChartData.reduce((sum, d) => sum + d.count, 0) / monthlyChartData.length || 0;

    // Calculate trend
    const recentWeeks = weeklyChartData.slice(-4);
    const earlierWeeks = weeklyChartData.slice(0, 4);
    const recentAvg = recentWeeks.reduce((sum, d) => sum + d.count, 0) / recentWeeks.length || 0;
    const earlierAvg = earlierWeeks.reduce((sum, d) => sum + d.count, 0) / earlierWeeks.length || 0;
    const trend = earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;

    const TrendIcon = trend > 0 ? TrendingUpIcon : TrendingDownIcon;

    // Calculate longest streak
    let currentStreak = 0;
    let longestStreak = 0;
    let lastDate: Date | null = null;

    sortedTrainings.forEach(training => {
        const currentDate = new Date(training.date);
        if (lastDate) {
            const daysDiff = Math.floor(
                (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
            );
            if (daysDiff <= 3) {
                // Allow up to 2 days gap
                currentStreak++;
            } else {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1;
            }
        } else {
            currentStreak = 1;
        }
        lastDate = currentDate;
    });
    longestStreak = Math.max(longestStreak, currentStreak);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Częstotliwość treningów</CardTitle>
                <CardDescription>Liczba treningów w czasie - tygodnie i miesiące</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {/* Weekly chart */}
                    <div>
                        <h4 className="mb-4 text-sm font-medium">Treningi tygodniowo</h4>
                        <ChartContainer config={chartConfig} className="aspect-auto h-60">
                            <BarChart
                                data={weeklyChartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="period" tickLine={false} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} />
                                <ChartTooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;

                                        return (
                                            <ChartTooltipContent
                                                className="w-[200px]"
                                                payload={payload.map(p => ({
                                                    ...p,
                                                    name: "Liczba treningów",
                                                    value: p.value,
                                                }))}
                                            />
                                        );
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill={chartConfig.weekly.color}
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ChartContainer>
                    </div>

                    {/* Monthly chart */}
                    <div>
                        <h4 className="mb-4 text-sm font-medium">Treningi miesięcznie</h4>
                        <ChartContainer config={chartConfig} className="aspect-auto h-60">
                            <LineChart
                                data={monthlyChartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="period" tickLine={false} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} />
                                <ChartTooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;

                                        return (
                                            <ChartTooltipContent
                                                className="w-[200px]"
                                                payload={payload.map(p => ({
                                                    ...p,
                                                    value: `${p.value} treningów`,
                                                    name: "Liczba treningów",
                                                }))}
                                                active={active}
                                            />
                                        );
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke={chartConfig.monthly.color}
                                    strokeWidth={2}
                                    dot={{ fill: chartConfig.monthly.color, r: 4 }}
                                />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    <CalendarIcon className="h-4 w-4" />
                    Średnio {avgWeekly.toFixed(1)} treningów/tydzień • {avgMonthly.toFixed(0)}{" "}
                    treningów/miesiąc
                </div>
                <div className="text-muted-foreground flex items-center gap-2 leading-none">
                    {Math.abs(trend).toFixed(0)}% {trend > 0 ? "wzrost" : "spadek"} częstotliwości w
                    ostatnich 4 tygodniach <TrendIcon className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    Najdłuższa seria: {longestStreak} treningów
                </div>
            </CardFooter>
        </Card>
    );
}
