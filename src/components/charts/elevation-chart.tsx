import React, { useMemo, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trainings } from '@/data/trainings';
import { getElevationMetricsOverTime } from '@/features/training/get-elevation-metrics-over-time';
import { getElevationPerKmMetricsOverTime } from '@/features/training/get-elevation-per-km-metrics-over-time';
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

type ChartVariant = 'elevation' | 'elevationPerKm';

interface ChartPayload {
    name: string;
    value: number;
    color: string;
}

export function ElevationChart() {
    const [variant, setVariant] = useState<ChartVariant>('elevation');

    const data = useMemo(() => {
        if (variant === 'elevationPerKm') {
            return getElevationPerKmMetricsOverTime(trainings as Training[]);
        } else {
            return getElevationMetricsOverTime(trainings as Training[]);
        }
    }, [variant]);

    const formattedData = data.map((item) => ({
        ...item,
        formattedDate: date(item.date).format('LL')
    }));

    return (
        <Card>
            <CardHeader>
                <div className='flex items-center justify-between'>
                    <CardTitle>Przewyższenie w czasie</CardTitle>
                    <Select value={variant} onValueChange={(value) => setVariant(value as ChartVariant)}>
                        <SelectTrigger>
                            <SelectValue placeholder='Wybierz wariant' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='elevation'>Przewyższenie</SelectItem>
                            <SelectItem value='elevationPerKm'>Przewyższenie na km</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
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
                        <ChartTooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <ChartTooltipContent
                                            className='w-[250px]'
                                            payload={payload as ChartPayload[]}
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
                            dataKey='elevation'
                            yAxisId='left'
                            fill={chartConfig.elevation.color}
                            stroke={chartConfig.elevation.color}
                            fillOpacity={0.3}
                        />
                        <ChartLegend
                            content={({ payload }) => {
                                if (payload && payload.length) {
                                    return <ChartLegendContent payload={payload as ChartPayload[]} />;
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
