'use client';

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
import date from '@/lib/date';
import { Training } from '@/types/training';

import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig = {
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
    },
    heartRate: {
        label: 'Średnie tętno',
        color: '#4f46e5'
    }
};

function parseTimeToMinutes(time: string): number {
    const [hours = '0', minutes = '0', seconds = '0'] = time.split(':');

    return parseInt(hours) * 60 + parseInt(minutes) + parseInt(seconds) / 60;
}

export function HeartRateChart() {
    const sortedTrainings = [...trainings]
        .filter((t) => t.heart_rate_zones && t.avg_heart_rate_bpm)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const data = sortedTrainings.map((training, index) => {
        // Calculate moving average using all trainings up to this point
        const trainingsToAverage = sortedTrainings.slice(0, index + 1);

        const zoneAverages = {
            zone_1: 0,
            zone_2: 0,
            zone_3: 0,
            zone_4: 0,
            zone_5: 0
        };

        trainingsToAverage.forEach((t) => {
            if (t.heart_rate_zones) {
                const zones = t.heart_rate_zones;
                const totalMinutes = Object.values(zones).reduce((sum, time) => sum + parseTimeToMinutes(time), 0);

                if (totalMinutes > 0) {
                    zoneAverages.zone_1 += parseTimeToMinutes(zones.zone_1) / totalMinutes;
                    zoneAverages.zone_2 += parseTimeToMinutes(zones.zone_2) / totalMinutes;
                    zoneAverages.zone_3 += parseTimeToMinutes(zones.zone_3) / totalMinutes;
                    zoneAverages.zone_4 += parseTimeToMinutes(zones.zone_4) / totalMinutes;
                    zoneAverages.zone_5 += parseTimeToMinutes(zones.zone_5) / totalMinutes;
                }
            }
        });

        const count = trainingsToAverage.length;

        return {
            date: training.date,
            formattedDate: date(training.date).format('LL'),
            zone_1: Number((zoneAverages.zone_1 / count).toFixed(3)),
            zone_2: Number((zoneAverages.zone_2 / count).toFixed(3)),
            zone_3: Number((zoneAverages.zone_3 / count).toFixed(3)),
            zone_4: Number((zoneAverages.zone_4 / count).toFixed(3)),
            zone_5: Number((zoneAverages.zone_5 / count).toFixed(3)),
            avg_heart_rate: training.avg_heart_rate_bpm || 0
        };
    });

    if (data.length < 2) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Tętno w czasie</CardTitle>
                    <CardDescription>Średni rozkład czasu w strefach tętna (w procentach)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='text-muted-foreground flex h-80 items-center justify-center'>
                        Brak wystarczających danych o tętnie
                    </div>
                </CardContent>
            </Card>
        );
    }

    const firstTraining = data[0];
    const lastTraining = data[data.length - 1];

    const firstHeartRate = firstTraining.avg_heart_rate || 0;
    const lastHeartRate = lastTraining.avg_heart_rate || 0;
    const heartRateTrend = firstHeartRate > 0 ? ((lastHeartRate - firstHeartRate) / firstHeartRate) * 100 : 0;
    const TrendIcon = heartRateTrend > 0 ? TrendingUpIcon : TrendingDownIcon;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tętno w czasie</CardTitle>
                <CardDescription>Średni rozkład czasu w strefach tętna (w procentach)</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className='aspect-auto h-80'>
                    <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} stackOffset='expand'>
                        <CartesianGrid strokeDasharray='3 3' vertical={false} />
                        <XAxis dataKey='formattedDate' tickLine={true} axisLine={false} />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                            domain={[0, 1]}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='line' />} />
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
                                    const legendPayload = payload.map((entry) => ({
                                        ...entry,
                                        name: chartConfig[entry.dataKey as keyof typeof chartConfig].label,
                                        color: chartConfig[entry.dataKey as keyof typeof chartConfig].color
                                    }));

                                    return <ChartLegendContent payload={legendPayload} />;
                                }

                                return null;
                            }}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className='flex-col items-start gap-2 text-sm'>
                <div className='flex gap-2 leading-none font-medium'>
                    {Math.abs(heartRateTrend).toFixed(1)}% {heartRateTrend > 0 ? 'wzrost' : 'spadek'} średniego tętna od
                    pierwszego treningu <TrendIcon className='h-4 w-4' />
                </div>
                <div className='text-muted-foreground leading-none'>
                    Pokazuje średni procentowy rozkład czasu w strefach tętna dla wszystkich treningów do danego momentu
                </div>
            </CardFooter>
        </Card>
    );
}
