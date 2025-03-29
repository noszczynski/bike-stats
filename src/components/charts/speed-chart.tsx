import React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';

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

interface SpeedChartProps {
    data: any[];
}

export function SpeedChart({ data }: SpeedChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Prędkość w czasie</CardTitle>
                <CardDescription>Średnia i maksymalna prędkość podczas treningów</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className='aspect-auto h-80'>
                    <LineChart data={data}>
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
