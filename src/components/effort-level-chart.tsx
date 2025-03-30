'use client';

import React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { isNil } from 'lodash';
import { Dumbbell, InfoIcon } from 'lucide-react';
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';

type EffortLevelChartProps = {
    effort: number;
};

export function EffortLevelChart({ effort }: EffortLevelChartProps) {
    // Function to determine color based on effort level
    const getEffortColor = (level: number): string => {
        if (isNil(level) || level === 0)
            return '#e0e0e0'; // Gray - No data
        else if (level <= 3)
            return '#4CAF50'; // Green - Easy
        else if (level <= 6)
            return '#FFC107'; // Yellow - Medium
        else if (level <= 8)
            return '#FF9800'; // Orange - Hard
        else return '#F44336'; // Red - All Out
    };

    // Function to recalculate effort (0-10) to value for 360 degree radius
    const recalculateEffortTo360 = (level: number): number => {
        // Convert effort scale (0-10) to percentage of 360 degrees
        // Using 10 as max effort value
        const maxEffort = 10;

        return level ? (level / maxEffort) * 100 : 0;
    };

    const effortColor = getEffortColor(effort);

    const chartData = [
        {
            name: 'Effort',
            effort: recalculateEffortTo360(effort),
            offset: recalculateEffortTo360(10 - effort)
        }
    ];

    const chartConfig = {} satisfies ChartConfig;

    return (
        <Card className='col-span-1 flex flex-col'>
            <CardHeader className='items-center pb-0'>
                <div className='flex items-center justify-start gap-2'>
                    <CardTitle>Poziom wysiłku {effort}</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <InfoIcon className='text-muted-foreground h-4 w-4' />
                            </TooltipTrigger>
                            <TooltipContent className='w-[300px]'>
                                <p>Poziom wysiłku: 1-3 łatwy, 4-6 średni, 7-8 trudny, 9-10 maksymalny</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className='text-muted-foreground flex items-center justify-start gap-2 text-sm'>
                    <div className='flex items-center gap-2'>
                        <Dumbbell className='h-4 w-4' />
                        <span>Subiektywny wysiłek podczas treningu</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className='flex-1 pb-2'>
                <ChartContainer config={chartConfig} className='mx-auto aspect-square max-h-[250px]'>
                    <RadialBarChart
                        data={chartData}
                        startAngle={90}
                        endAngle={-270}
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
                        <RadialBar
                            dataKey='effort'
                            cornerRadius={15}
                            fill={effortColor}
                            stackId='a'
                            className='stroke-transparent stroke-2'
                        />
                        <RadialBar
                            dataKey='offset'
                            fill='transparent'
                            stackId='a'
                            cornerRadius={15}
                            className='stroke-transparent stroke-2'
                        />
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
                                                    style={{ fill: effortColor }}>
                                                    {effort}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className='fill-muted-foreground'>
                                                    {effort === 0
                                                        ? 'Brak danych'
                                                        : effort <= 3
                                                          ? 'Łatwy'
                                                          : effort <= 6
                                                            ? 'Średni'
                                                            : effort <= 8
                                                              ? 'Trudny'
                                                              : 'Maksymalny'}
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
