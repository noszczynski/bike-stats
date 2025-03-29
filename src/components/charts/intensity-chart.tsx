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
import trainings from '@/data/trainings.json';
import { getIntensityMetricsOverTime } from '@/features/training/get-intensity-metrics-over-time';
import date from '@/lib/date';
import { Training } from '@/types/training';

import { InfoIcon } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig = {
    intensity: {
        label: 'Intensywność',
        color: '#4f46e5'
    }
};

export function IntensityChart() {
    const data = getIntensityMetricsOverTime(trainings as Training[]);
    const formattedData = data.map((item) => ({
        ...item,
        formattedDate: date(item.date).format('MMM YYYY')
    }));

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
                <CardDescription>Wskaźnik intensywności treningów (0-100)</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className='aspect-auto h-80'>
                    <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='formattedDate' tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
                        <ChartTooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <ChartTooltipContent
                                            className='w-[250px]'
                                            payload={payload.map((p) => ({
                                                ...p,
                                                value: p.value,
                                                name: chartConfig.intensity.label
                                            }))}
                                            active={active}
                                            label={label}
                                        />
                                    );
                                }

                                return null;
                            }}
                        />
                        <Bar
                            name='intensity'
                            dataKey='intensity'
                            fill={chartConfig.intensity.color}
                            radius={[4, 4, 0, 0]}
                        />
                        <ChartLegend
                            content={({ payload }) => {
                                if (payload && payload.length) {
                                    return <ChartLegendContent payload={payload} />;
                                }

                                return null;
                            }}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
