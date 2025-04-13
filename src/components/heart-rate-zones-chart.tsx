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

import {
    Bar,
    BarChart,
    CartesianGrid,
    LabelList,
    Pie,
    PieChart,
    Rectangle,
    ResponsiveContainer,
    XAxis,
    YAxis
} from 'recharts';

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

// Helper function to format minutes back to time string
function formatSeconds(seconds: number): string {
    return formatMinutes(seconds / 60);
}

type TooltipProps = {
    active?: boolean;
    payload?: Array<{
        name?: string;
        value?: number;
        payload?: {
            fill?: string;
            percentage?: number;
            displayTime?: string;
        };
    }>;
};

export function HeartRateZonesChart({ heartRateZones }: HeartRateZonesChartProps) {
    // Convert time strings to minutes
    const minutesData = [
        { zone: 'zone_1', value: timeToMinutes(heartRateZones.zone_1), fill: '#4CAF50' },
        { zone: 'zone_2', value: timeToMinutes(heartRateZones.zone_2), fill: '#8BC34A' },
        { zone: 'zone_3', value: timeToMinutes(heartRateZones.zone_3), fill: '#FFC107' },
        { zone: 'zone_4', value: timeToMinutes(heartRateZones.zone_4), fill: '#FF9800' },
        { zone: 'zone_5', value: timeToMinutes(heartRateZones.zone_5), fill: '#F44336' }
    ];

    // Calculate total time for percentage calculation
    const totalMinutes = minutesData.reduce((sum, item) => sum + item.value, 0);

    // Create chart data with percentages
    const chartData = minutesData.map((item) => ({
        ...item,
        percentage: totalMinutes > 0 ? Math.round((item.value / totalMinutes) * 100) : 0,
        displayTime: formatMinutes(item.value)
    }));

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

    // Custom tooltip to show both percentage and time
    const CustomTooltip = ({ active, payload }: TooltipProps) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const zoneName = chartConfig[data.name as keyof typeof chartConfig]?.label || '';

            return (
                <ChartTooltipContent>
                    <p className='font-medium'>{zoneName}</p>
                    <p>{`${data.payload?.percentage}% (${data.payload?.displayTime})`}</p>
                </ChartTooltipContent>
            );
        }

        return null;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Strefy tętna</CardTitle>
                <CardDescription>Rozkład czasu w strefach tętna</CardDescription>
            </CardHeader>
            <CardContent className='px-0'>
                <ChartContainer config={chartConfig}>
                    <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey='zone'
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label}
                            label={{ value: 'Strefy tętna', position: 'insideBottom', offset: 0, dy: 10 }}
                        />
                        <YAxis
                            tickFormatter={(value) => `${value}%`}
                            domain={[0, 100]}
                            ticks={[0, 20, 40, 60, 80, 100]}
                        />
                        <ChartTooltip cursor={false} content={<CustomTooltip />} />
                        <Bar dataKey='percentage' strokeWidth={2} radius={6}>
                            <LabelList dataKey='percentage' position='top' formatter={(value: number) => `${value}%`} />
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
