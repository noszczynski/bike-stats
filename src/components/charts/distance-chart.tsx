import React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';
import trainings from '@/data/trainings.json';
import { getDistanceMetricsOverTime } from '@/features/training/get-distance-metrics-over-time';
import date from '@/lib/date';
import { Training } from '@/types/training';

import { Bar, BarChart, CartesianGrid, Line, XAxis, YAxis } from 'recharts';

const chartConfig = {
    distance: {
        label: 'Dystans (km)',
        color: '#4f46e5'
    },
    cumulative: {
        label: 'Łączny dystans (km)',
        color: '#ef4444'
    }
};

export function DistanceChart() {
    const data = getDistanceMetricsOverTime(trainings as Training[]);
    const formattedData = data.map((item) => ({
        ...item,
        formattedDate: date(item.date).format('MMM YYYY')
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dystans w czasie</CardTitle>
                <CardDescription>Dystans poszczególnych treningów i łączny przejechany dystans</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className='aspect-auto h-80'>
                    <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='formattedDate' tickLine={false} axisLine={false} />
                        <YAxis
                            yAxisId='left'
                            orientation='left'
                            label={{ value: 'km (trening)', angle: -90, position: 'insideLeft' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId='right'
                            orientation='right'
                            name='cumulative'
                            label={{ value: 'km (łącznie)', angle: 90, position: 'insideRight' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <ChartTooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <ChartTooltipContent
                                            className='w-[250px]'
                                            payload={payload}
                                            active={active}
                                            label={label}
                                        />
                                    );
                                }

                                return null;
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
