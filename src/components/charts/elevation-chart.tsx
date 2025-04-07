'use client';

import React, { useState } from 'react';

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
import date from '@/lib/date';
import { Training } from '@/types/training';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig = {
    elevation: {
        label: 'Średnie przewyższenie (m)',
        color: '#4f46e5'
    },
    elevationPerKm: {
        label: 'Średnie przewyższenie na km',
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

    // Sort trainings by date
    const sortedTrainings = [...trainings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate moving averages
    const data = sortedTrainings.map((training, index) => {
        // Get all trainings up to current index (inclusive)
        const trainingsToAverage = sortedTrainings.slice(0, index + 1);

        // Calculate average elevation or elevation per km
        let value;
        if (variant === 'elevationPerKm') {
            const totalElevation = trainingsToAverage.reduce((sum, t) => sum + t.elevation_gain_m, 0);
            const totalDistance = trainingsToAverage.reduce((sum, t) => sum + t.distance_km, 0);
            value = totalElevation / totalDistance;
        } else {
            value = trainingsToAverage.reduce((sum, t) => sum + t.elevation_gain_m, 0) / trainingsToAverage.length;
        }

        return {
            date: training.date,
            formattedDate: date(training.date).format('LL'),
            elevation: variant === 'elevation' ? Number(value.toFixed(1)) : undefined,
            elevationPerKm: variant === 'elevationPerKm' ? Number(value.toFixed(1)) : undefined
        };
    });

    // Calculate progress
    const firstValue = data[0]?.[variant === 'elevation' ? 'elevation' : 'elevationPerKm'] || 0;
    const lastValue = data[data.length - 1]?.[variant === 'elevation' ? 'elevation' : 'elevationPerKm'] || 0;
    const progress = ((lastValue - firstValue) / firstValue) * 100;

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
                <CardDescription>Średnie przewyższenie i średnie przewyższenie na kilometr</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className='aspect-auto h-80'>
                    <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='formattedDate' tickLine={false} axisLine={false} />
                        <YAxis
                            yAxisId='left'
                            orientation='left'
                            label={{
                                value: variant === 'elevation' ? 'm' : 'm/km',
                                angle: -90,
                                position: 'insideLeft'
                            }}
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
                                            value: `${p.value} ${variant === 'elevation' ? 'm' : 'm/km'}`,
                                            name: chartConfig[variant].label
                                        }))}
                                        active={active}
                                    />
                                );
                            }}
                        />
                        <Area
                            name={variant}
                            type='monotone'
                            dataKey={variant}
                            yAxisId='left'
                            fill={chartConfig[variant].color}
                            stroke={chartConfig[variant].color}
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
