'use client';

import React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';
import { trainings } from '@/data/trainings';
import date from '@/lib/date';
import { Training } from '@/types/training';

import { Bar, BarChart, CartesianGrid, Line, XAxis, YAxis } from 'recharts';

const chartConfig = {
    distance: {
        label: 'Średni dystans (km)',
        color: '#4f46e5'
    },
    cumulative: {
        label: 'Łączny dystans (km)',
        color: '#ef4444'
    }
};

export function DistanceChart() {
    // Sort trainings by date
    const sortedTrainings = [...trainings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate moving average and cumulative distance
    const data = sortedTrainings.map((training, index) => {
        // Get all trainings up to current index (inclusive)
        const trainingsToAverage = sortedTrainings.slice(0, index + 1);

        // Calculate average distance
        const avgDistance = trainingsToAverage.reduce((sum, t) => sum + t.distance_km, 0) / trainingsToAverage.length;

        // Calculate cumulative distance
        const cumulativeDistance = trainingsToAverage.reduce((sum, t) => sum + t.distance_km, 0);

        return {
            date: training.date,
            formattedDate: date(training.date).format('MMM YYYY'),
            distance: Number(avgDistance.toFixed(1)),
            cumulativeDistance: Number(cumulativeDistance.toFixed(1))
        };
    });

    // Calculate progress
    const firstDistance = data[0]?.distance || 0;
    const lastDistance = data[data.length - 1]?.distance || 0;
    const distanceProgress = ((lastDistance - firstDistance) / firstDistance) * 100;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dystans w czasie</CardTitle>
                <CardDescription>Średni dystans treningów i łączny przejechany dystans</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className='aspect-auto h-80'>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='formattedDate' tickLine={false} axisLine={false} />
                        <YAxis
                            yAxisId='left'
                            orientation='left'
                            label={{ value: 'km (średnia)', angle: -90, position: 'insideLeft' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId='right'
                            orientation='right'
                            label={{ value: 'km (łącznie)', angle: 90, position: 'insideRight' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <ChartTooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;

                                return (
                                    <ChartTooltipContent
                                        className='w-[250px]'
                                        payload={payload.map((p) => ({
                                            ...p,
                                            value: `${p.value} km`,
                                            name: chartConfig[p.dataKey as keyof typeof chartConfig].label
                                        }))}
                                        active={active}
                                    />
                                );
                            }}
                        />
                        <Bar
                            name='distance'
                            dataKey='distance'
                            yAxisId='left'
                            fill={chartConfig.distance.color}
                            radius={[4, 4, 0, 0]}
                        />
                        <Line
                            name='cumulative'
                            type='monotone'
                            dataKey='cumulativeDistance'
                            yAxisId='right'
                            stroke={chartConfig.cumulative.color}
                            strokeWidth={2}
                            dot={false}
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
        </Card>
    );
}
