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
import date from '@/lib/date';
import { Training } from '@/types/training';

import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig = {
    pace: {
        label: 'Tempo (min/km)',
        color: '#ef4444'
    }
};

// Helper function to convert time string (hh:mm:ss) to seconds
function timeToSeconds(timeString: string): number {
    const [hours = '0', minutes = '0', seconds = '0'] = timeString.split(':');

    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
}

// Helper function to convert seconds to mm:ss format
function secondsToMinutesFormat(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function PaceChart({ trainings }: { trainings: Training[] }) {
    // Filter out trainings with no distance or time data and sort by date
    const sortedTrainings = [...trainings]
        .filter((t) => t.distance_km > 0 && t.moving_time)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sortedTrainings.length < 2) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Tempo</CardTitle>
                    <CardDescription>Średnie tempo (czas na 1 km)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='text-muted-foreground flex h-80 items-center justify-center'>
                        Brak wystarczających danych o tempie
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Calculate pace for each training and moving average
    const data = sortedTrainings.map((training, index) => {
        // Calculate pace for this training (seconds per km)
        const trainingTimeSeconds = timeToSeconds(training.moving_time);
        const paceSeconds = trainingTimeSeconds / training.distance_km;

        // Get all trainings up to current index (inclusive) for moving average
        const trainingsToAverage = sortedTrainings.slice(0, index + 1);

        // Calculate moving average pace
        const totalPaceSeconds = trainingsToAverage.reduce((sum, t) => {
            const timeSeconds = timeToSeconds(t.moving_time);
            const tPaceSeconds = timeSeconds / t.distance_km;

            return sum + tPaceSeconds;
        }, 0);

        const avgPaceSeconds = totalPaceSeconds / trainingsToAverage.length;

        return {
            date: training.date,
            formattedDate: date(training.date).format('MMM YYYY'),
            pace: Number(avgPaceSeconds.toFixed(1)),
            paceFormatted: secondsToMinutesFormat(avgPaceSeconds),
            rawPace: Number(paceSeconds.toFixed(1)),
            rawPaceFormatted: secondsToMinutesFormat(paceSeconds)
        };
    });

    // Calculate trend (note: for pace, lower is better so trend calculation is inverted)
    const firstPace = data[0]?.pace || 0;
    const lastPace = data[data.length - 1]?.pace || 0;
    const paceTrend = ((firstPace - lastPace) / firstPace) * 100;

    // For pace, trending down is good (faster)
    const TrendIcon = paceTrend > 0 ? TrendingDownIcon : TrendingUpIcon;
    const trendDescription = paceTrend > 0 ? 'poprawa' : 'pogorszenie';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tempo</CardTitle>
                <CardDescription>Średnia krocząca tempa (min/km)</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className='aspect-auto h-80'>
                    <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='formattedDate' tickLine={false} axisLine={false} />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            domain={['dataMin - 10', 'dataMax + 10']}
                            tickFormatter={(value) => secondsToMinutesFormat(value)}
                            label={{ value: 'min/km', angle: -90, position: 'insideLeft' }}
                        />
                        <ChartTooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;

                                return (
                                    <ChartTooltipContent
                                        className='w-[250px]'
                                        payload={payload.map((p) => {
                                            const paceFormatted = payload[0]?.payload.paceFormatted;
                                            const rawPaceFormatted = payload[0]?.payload.rawPaceFormatted;

                                            return {
                                                ...p,
                                                value: `${paceFormatted} min/km (pojedynczy trening: ${rawPaceFormatted} min/km)`,
                                                name: chartConfig.pace.label
                                            };
                                        })}
                                        active={active}
                                    />
                                );
                            }}
                        />
                        <Area
                            name='pace'
                            type='monotone'
                            dataKey='pace'
                            fill={chartConfig.pace.color}
                            stroke={chartConfig.pace.color}
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
                    {Math.abs(paceTrend).toFixed(1)}% {trendDescription} tempa od pierwszego treningu{' '}
                    <TrendIcon className='h-4 w-4' />
                </div>
                <div className='text-muted-foreground leading-none'>
                    Pokazuje średnią kroczącą tempa (min/km) dla wszystkich treningów do danego momentu
                </div>
            </CardFooter>
        </Card>
    );
}
