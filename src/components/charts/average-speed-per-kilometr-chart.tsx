'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { trainings } from '@/data/trainings';
import date from '@/lib/date';
import { Training } from '@/types/training';

import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig = {
    speed: {
        label: 'Średnia prędkość',
        theme: {
            light: '#F44336',
            dark: '#F44336'
        }
    }
};

export function AverageSpeedPerKilometrChart() {
    // Sort trainings by date
    const sortedTrainings = [...trainings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate moving average
    const data = sortedTrainings.map((training, index) => {
        // Get all trainings up to current index (inclusive)
        const trainingsToAverage = sortedTrainings.slice(0, index + 1);

        // Calculate average speed per kilometer
        const avgSpeed = trainingsToAverage.reduce((sum, t) => sum + t.avg_speed_kmh, 0) / trainingsToAverage.length;

        return {
            date: training.date,
            formattedDate: date(training.date).format('LL'),
            speed: Number(avgSpeed.toFixed(1))
        };
    });

    // Calculate progress trend based on the moving averages
    const firstSpeed = data[0]?.speed || 0;
    const lastSpeed = data[data.length - 1]?.speed || 0;
    const speedProgress = ((lastSpeed - firstSpeed) / firstSpeed) * 100;

    const TrendIcon = speedProgress > 0 ? TrendingUpIcon : TrendingDownIcon;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Średnia prędkość w czasie</CardTitle>
                <CardDescription>Średnia krocząca prędkości dla wszystkich treningów</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className='aspect-auto h-80'>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray='3 3' vertical={false} />
                        <XAxis dataKey='formattedDate' tickLine={true} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value} km/h`} />
                        <Bar dataKey='speed' fill='#F44336' radius={[4, 4, 0, 0]} className='fill-[#F44336]' />
                        <ChartTooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;

                                return (
                                    <ChartTooltipContent
                                        className='w-[250px]'
                                        payload={payload.map((p) => ({
                                            ...p,
                                            value: `${p.value} km/h`,
                                            name: chartConfig.speed.label
                                        }))}
                                        active={active}
                                    />
                                );
                            }}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className='flex-col items-start gap-2 text-sm'>
                <div className='flex gap-2 leading-none font-medium'>
                    {Math.abs(speedProgress).toFixed(1)}% {speedProgress > 0 ? 'wzrost' : 'spadek'} średniej prędkości
                    od pierwszego treningu <TrendIcon className='h-4 w-4' />
                </div>
                <div className='text-muted-foreground leading-none'>
                    Pokazuje średnią kroczącą prędkość dla wszystkich treningów do danego momentu
                </div>
            </CardFooter>
        </Card>
    );
}
