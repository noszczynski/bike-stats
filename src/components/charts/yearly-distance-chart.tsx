'use client';

import React from 'react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';
import { Training } from '@/types/training';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig = {
    yearlyDistance: {
        label: 'Łączny dystans (km)',
        color: '#ef4444' // Using the red color from other charts
    }
};

export function YearlyDistanceChart({ trainings }: { trainings: Training[] }) {
    // Group trainings by year and calculate total distance
    const yearlyData = trainings.reduce<Record<string, number>>((acc, training) => {
        const year = new Date(training.date).getFullYear().toString();
        acc[year] = (acc[year] || 0) + training.distance_km;

        return acc;
    }, {});

    // Convert to array format for chart, sorted by year
    const data = Object.entries(yearlyData)
        .map(([year, distance]) => ({
            year,
            yearlyDistance: Number(distance.toFixed(1))
        }))
        .sort((a, b) => Number(a.year) - Number(b.year));

    // Calculate total distance for all years
    const totalDistance = data.reduce((sum, item) => sum + item.yearlyDistance, 0);

    // Calculate year with the highest distance
    const maxDistanceYear =
        data.length > 0
            ? data.reduce((max, item) => (item.yearlyDistance > max.yearlyDistance ? item : max)).year
            : 'N/A';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dystans według roku</CardTitle>
                <CardDescription>Łączny przejechany dystans w każdym roku</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className='aspect-auto h-80'>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='year' tickLine={false} axisLine={false} />
                        <YAxis
                            label={{ value: 'Dystans (km)', angle: -90, position: 'insideLeft' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <ChartTooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;

                                return (
                                    <ChartTooltipContent
                                        className='w-[200px]'
                                        payload={payload.map((p) => ({
                                            ...p,
                                            value: `${p.value} km`,
                                            name: chartConfig.yearlyDistance.label
                                        }))}
                                        active={active}
                                    />
                                );
                            }}
                        />
                        <Bar
                            name='yearlyDistance'
                            dataKey='yearlyDistance'
                            fill={chartConfig.yearlyDistance.color}
                            radius={[4, 4, 0, 0]}
                        />
                        <ChartLegend
                            content={({ payload }) => {
                                if (payload && payload.length) {
                                    return <ChartLegendContent payload={payload} />;
                                }

                                return null;
                            }}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className='flex-col items-start gap-2 text-sm'>
                <div className='flex gap-2 leading-none font-medium'>Łączny dystans: {totalDistance.toFixed(1)} km</div>
                <div className='text-muted-foreground leading-none'>
                    Rok z największym dystansem: {maxDistanceYear} (
                    {data.find((d) => d.year === maxDistanceYear)?.yearlyDistance.toFixed(1) || 0} km)
                </div>
            </CardFooter>
        </Card>
    );
}
