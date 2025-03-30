'use client';

import React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { Battery, InfoIcon } from 'lucide-react';
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';

type BatteryUsageChartProps = {
    device: string | null;
    batteryUsage: number | null;
};

export function BatteryUsageChart({ device, batteryUsage }: BatteryUsageChartProps) {
    // Function to determine color based on battery usage
    const getBatteryColor = (usage: number | null): string => {
        if (usage === null) return '#e0e0e0'; // Gray - No data
        if (usage <= 10) return '#4CAF50'; // Green
        if (usage <= 25) return '#8BC34A'; // Light green
        if (usage <= 50) return '#FFC107'; // Yellow
        if (usage <= 75) return '#FF9800'; // Orange

        return '#F44336'; // Red
    };

    const batteryColor = getBatteryColor(batteryUsage);

    const chartData = [
        {
            name: 'battery',
            value: batteryUsage === null ? 0 : batteryUsage,
            fill: batteryColor
        }
    ];

    const chartConfig = {
        battery: {
            label: 'Battery Usage',
            color: batteryColor
        }
    } satisfies ChartConfig;

    return (
        <Card className='col-span-1 flex flex-col'>
            <CardHeader className='items-center pb-0'>
                <div className='flex items-center justify-start gap-2'>
                    <CardTitle>Zużycie Baterii</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <InfoIcon className='text-muted-foreground h-4 w-4' />
                            </TooltipTrigger>
                            <TooltipContent className='w-[300px]'>
                                <p>Zużycie baterii podczas treningu{device ? ` zmierzone przez ${device}.` : '.'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className='text-muted-foreground flex items-center justify-start gap-2 text-sm'>
                    <div className='flex items-center gap-2'>
                        <Battery className='h-4 w-4' />
                        <span>Procent baterii zużytej podczas treningu</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className='flex-1 pb-2'>
                <ChartContainer config={chartConfig} className='mx-auto aspect-square max-h-[250px]'>
                    <RadialBarChart
                        data={chartData}
                        startAngle={0}
                        endAngle={100}
                        innerRadius={80}
                        outerRadius={140}
                        barSize={15}
                        maxBarSize={15}>
                        <PolarGrid
                            gridType='circle'
                            radialLines={false}
                            stroke='none'
                            className='first:fill-muted last:fill-background'
                            polarRadius={[86, 74]}
                        />
                        <RadialBar dataKey='value' cornerRadius={15} background={{ fill: '#e0e0e0' }} />
                        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor='middle'
                                                dominantBaseline='middle'>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className='text-4xl font-bold'
                                                    style={{ fill: batteryColor }}>
                                                    {batteryUsage === null ? 'N/A' : `${batteryUsage}%`}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className='fill-muted-foreground'>
                                                    Zużycie
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </PolarRadiusAxis>
                    </RadialBarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
