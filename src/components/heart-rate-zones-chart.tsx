'use client';

import React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';

import { Bar, BarChart, CartesianGrid, LabelList, Pie, PieChart, Rectangle, XAxis } from 'recharts';

type HeartRateZones = {
    zone_1: string;
    zone_2: string;
    zone_3: string;
    zone_4: string;
    zone_5: string;
};

type HeartRateZonesChartProps = {
    heartRateZones: HeartRateZones;
};

// Helper function to convert time string (hh:mm:ss) to minutes
function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);

    return hours * 60 + minutes;
}

// Helper function to format minutes back to time string
function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

type TooltipProps = {
    active?: boolean;
    payload?: Array<{
        name?: string;
        value?: number;
        payload?: {
            fill?: string;
        };
    }>;
};

export function HeartRateZonesChart({ heartRateZones }: HeartRateZonesChartProps) {
    const chartData = [
        { zone: 'zone_1', value: timeToMinutes(heartRateZones.zone_1), fill: '#4CAF50' },
        { zone: 'zone_2', value: timeToMinutes(heartRateZones.zone_2), fill: '#8BC34A' },
        { zone: 'zone_3', value: timeToMinutes(heartRateZones.zone_3), fill: '#FFC107' },
        { zone: 'zone_4', value: timeToMinutes(heartRateZones.zone_4), fill: '#FF9800' },
        { zone: 'zone_5', value: timeToMinutes(heartRateZones.zone_5), fill: '#F44336' }
    ];

    const chartConfig = {
        value: {
            label: 'Czas'
        },
        zone_1: {
            label: 'Strefa 1',
            color: '#4CAF50'
        },
        zone_2: {
            label: 'Strefa 2',
            color: '#8BC34A'
        },
        zone_3: {
            label: 'Strefa 3',
            color: '#FFC107'
        },
        zone_4: {
            label: 'Strefa 4',
            color: '#FF9800'
        },
        zone_5: {
            label: 'Strefa 5',
            color: '#F44336'
        }
    } satisfies ChartConfig;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Strefy tętna</CardTitle>
                <CardDescription>Rozkład czasu w strefach tętna</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className='max-h-[192px]'>
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey='zone'
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey='value' strokeWidth={2} radius={6} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
