'use client';

import React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { trainings } from '@/data/trainings';
import date from '@/lib/date';
import { Training } from '@/types/training';

import { InfoIcon } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig = {
    intensity: {
        label: 'Średnia intensywność',
        color: '#4f46e5'
    }
};

export function IntensityChart() {
    // Sort trainings by date
    const sortedTrainings = [...trainings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate moving average intensity
    const data = sortedTrainings.map((training, index) => {
        // Get all trainings up to current index (inclusive)
        const trainingsToAverage = sortedTrainings.slice(0, index + 1);

        // Find max values for normalization
        const maxDistance = Math.max(...trainingsToAverage.map((t) => t.distance_km));
        const maxSpeed = Math.max(...trainingsToAverage.map((t) => t.avg_speed_kmh));
        const maxHeartRate = Math.max(...trainingsToAverage.map((t) => t.avg_heart_rate_bpm || 0));
        const maxElevation = Math.max(...trainingsToAverage.map((t) => t.elevation_gain_m));

        // Calculate normalized components for each training
        const intensities = trainingsToAverage.map((t) => {
            const distanceScore = (t.distance_km / maxDistance) * 30;
            const speedScore = (t.avg_speed_kmh / maxSpeed) * 30;
            const heartRateScore = t.avg_heart_rate_bpm ? (t.avg_heart_rate_bpm / maxHeartRate) * 20 : 0;
            const elevationScore = (t.elevation_gain_m / maxElevation) * 20;

            return distanceScore + speedScore + heartRateScore + elevationScore;
        });

        // Calculate average intensity
        const avgIntensity = intensities.reduce((sum, score) => sum + score, 0) / intensities.length;

        return {
            date: training.date,
            formattedDate: date(training.date).format('MMM YYYY'),
            intensity: Number(avgIntensity.toFixed(1))
        };
    });

    // Calculate progress
    const firstIntensity = data[0]?.intensity || 0;
    const lastIntensity = data[data.length - 1]?.intensity || 0;
    const intensityProgress = ((lastIntensity - firstIntensity) / firstIntensity) * 100;

    return (
        <Card>
            <CardHeader>
                <div className='flex items-center gap-2'>
                    <CardTitle>Intensywność treningu</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <InfoIcon className='text-muted-foreground h-4 w-4' />
                            </TooltipTrigger>
                            <TooltipContent className='w-[300px]'>
                                <p>Wskaźnik intensywności treningów (0-100) jest obliczany na podstawie:</p>
                                <ul className='mt-2 list-disc pl-4'>
                                    <li>Dystansu (30%)</li>
                                    <li>Prędkości (30%)</li>
                                    <li>Tętna (20%)</li>
                                    <li>Przewyższenia (20%)</li>
                                </ul>
                                <p className='mt-2'>
                                    Każdy komponent jest normalizowany względem maksymalnej wartości w historii
                                    treningów.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <CardDescription>Średni wskaźnik intensywności treningów (0-100)</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className='aspect-auto h-80'>
                    <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='formattedDate' tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
                        <ChartTooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;

                                return (
                                    <ChartTooltipContent
                                        className='w-[250px]'
                                        payload={payload.map((p) => ({
                                            ...p,
                                            value: Number(p.value).toFixed(1),
                                            name: chartConfig.intensity.label
                                        }))}
                                        active={active}
                                    />
                                );
                            }}
                        />
                        <Area
                            name='intensity'
                            type='monotone'
                            dataKey='intensity'
                            fill={chartConfig.intensity.color}
                            stroke={chartConfig.intensity.color}
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
        </Card>
    );
}
