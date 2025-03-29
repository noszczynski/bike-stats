import React from 'react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';
import { trainings } from '@/data/trainings';
import { calculateTrend } from '@/features/training/calculate-trend';
import { getHeartRateMetricsOverTime } from '@/features/training/get-heart-rate-metrics-over-time';
import date from '@/lib/date';
import { Training } from '@/types/training';

import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig = {
    heartRate: {
        label: 'Średnie tętno',
        color: '#4f46e5'
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
};

export function HeartRateChart() {
    const data = getHeartRateMetricsOverTime(trainings as Training[]);

    const formattedData = data.map((item) => ({
        ...item,
        formattedDate: date(item.date).format('LL')
    }));

    // Calculate trend for average heart rate
    const heartRateTrend = calculateTrend(
        trainings,
        (training) => training.avg_heart_rate_bpm || 0,
        3, // recent period
        3 // older period
    );

    const TrendIcon = heartRateTrend > 0 ? TrendingUpIcon : TrendingDownIcon;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tętno w czasie</CardTitle>
                <CardDescription>Rozkład czasu w strefach tętna (w procentach)</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className='aspect-auto h-80'>
                    <AreaChart
                        data={formattedData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        stackOffset='expand'>
                        <CartesianGrid strokeDasharray='3 3' vertical={false} />
                        <XAxis dataKey='formattedDate' tickLine={true} axisLine={false} />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                            domain={[0, 1]}
                        />
                        <ChartTooltip
                            content={({ active, payload, label, ...args }) => {
                                if (active && payload && payload.length) {
                                    // Calculate total time for percentage
                                    const totalTime = payload.reduce((sum, p) => sum + (Number(p.value) || 0), 0);

                                    return (
                                        <ChartTooltipContent
                                            className='w-[250px]'
                                            payload={payload.map((p) => ({
                                                ...p,
                                                value: `${(((Number(p.value) || 0) / totalTime) * 100).toFixed(1)}%`,
                                                name: chartConfig[p.name as keyof typeof chartConfig].label
                                            }))}
                                            active={active}
                                            label={label}
                                        />
                                    );
                                }

                                return null;
                            }}
                        />
                        <Area
                            name='zone_1'
                            type='monotone'
                            dataKey='zone_1'
                            stackId='zones'
                            fill={chartConfig.zone_1.color}
                            stroke={chartConfig.zone_1.color}
                            fillOpacity={0.3}
                        />
                        <Area
                            name='zone_2'
                            type='monotone'
                            dataKey='zone_2'
                            stackId='zones'
                            fill={chartConfig.zone_2.color}
                            stroke={chartConfig.zone_2.color}
                            fillOpacity={0.3}
                        />
                        <Area
                            name='zone_3'
                            type='monotone'
                            dataKey='zone_3'
                            stackId='zones'
                            fill={chartConfig.zone_3.color}
                            stroke={chartConfig.zone_3.color}
                            fillOpacity={0.3}
                        />
                        <Area
                            name='zone_4'
                            type='monotone'
                            dataKey='zone_4'
                            stackId='zones'
                            fill={chartConfig.zone_4.color}
                            stroke={chartConfig.zone_4.color}
                            fillOpacity={0.3}
                        />
                        <Area
                            name='zone_5'
                            type='monotone'
                            dataKey='zone_5'
                            stackId='zones'
                            fill={chartConfig.zone_5.color}
                            stroke={chartConfig.zone_5.color}
                            fillOpacity={0.3}
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
            <CardFooter className='flex-col items-start gap-2 text-sm'>
                <div className='flex gap-2 leading-none font-medium'>
                    {Math.abs(heartRateTrend).toFixed(1)}% {heartRateTrend > 0 ? 'wzrost' : 'spadek'} średniego tętna w
                    ostatnich 3 miesiącach <TrendIcon className='h-4 w-4' />
                </div>
                <div className='text-muted-foreground leading-none'>
                    Pokazuje procentowy rozkład czasu w strefach tętna dla każdego treningu
                </div>
            </CardFooter>
        </Card>
    );
}
