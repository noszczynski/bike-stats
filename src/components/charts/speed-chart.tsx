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
import { getSpeedMetricsOverTime } from '@/features/training/get-speed-metrics-over-time';
import date from '@/lib/date';
import { Training } from '@/types/training';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

const chartConfig = {
    average: {
        label: 'Średnia prędkość',
        color: '#4f46e5'
    },
    maximum: {
        label: 'Prędkość maksymalna',
        color: '#ef4444'
    }
};

export function SpeedChart() {
    const data = getSpeedMetricsOverTime(trainings as Training[]);
    const formattedData = data.map((item) => ({
        ...item,
        formattedDate: date(item.date).format('MMM YYYY')
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Prędkość w czasie</CardTitle>
                <CardDescription>Średnia i maksymalna prędkość podczas treningów</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className='aspect-auto h-80'>
                    <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='formattedDate' tickLine={false} axisLine={false} />
                        <YAxis
                            label={{ value: 'km/h', angle: -90, position: 'insideLeft' }}
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
                        <Line
                            name='average'
                            type='monotone'
                            dataKey='avgSpeed'
                            stroke={chartConfig.average.color}
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            name='maximum'
                            type='monotone'
                            dataKey='maxSpeed'
                            stroke={chartConfig.maximum.color}
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
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
