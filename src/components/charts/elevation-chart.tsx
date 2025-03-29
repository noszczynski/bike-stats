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
import { getElevationMetricsOverTime } from '@/features/training/get-elevation-metrics-over-time';
import date from '@/lib/date';
import { Training } from '@/types/training';

import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from 'recharts';

const chartConfig = {
    elevation: {
        label: 'Przewyższenie (m)',
        color: '#4f46e5'
    },
    elevationPerKm: {
        label: 'Przewyższenie na km',
        color: '#ef4444'
    }
};

export function ElevationChart() {
    const data = getElevationMetricsOverTime(trainings as Training[]);
    const formattedData = data.map((item) => ({
        ...item,
        formattedDate: date(item.date).format('MMM YYYY')
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Przewyższenie w czasie</CardTitle>
                <CardDescription>Całkowite przewyższenie i przewyższenie na kilometr</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className='aspect-auto h-80'>
                    <AreaChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='formattedDate' tickLine={false} axisLine={false} />
                        <YAxis
                            yAxisId='left'
                            orientation='left'
                            label={{ value: 'm', angle: -90, position: 'insideLeft' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId='right'
                            orientation='right'
                            label={{ value: 'm/km', angle: 90, position: 'insideRight' }}
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
                        <Area
                            name='elevation'
                            type='monotone'
                            dataKey='elevationGain'
                            yAxisId='left'
                            fill={chartConfig.elevation.color}
                            stroke={chartConfig.elevation.color}
                            fillOpacity={0.3}
                        />
                        <Line
                            name='elevationPerKm'
                            type='monotone'
                            dataKey='elevationPerKm'
                            yAxisId='right'
                            stroke={chartConfig.elevationPerKm.color}
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
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
