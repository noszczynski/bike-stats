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
import trainings from '@/data/trainings.json';
import { getDistanceMetricsOverTime } from '@/features/training/get-distance-metrics-over-time';
import { getElevationMetricsOverTime } from '@/features/training/get-elevation-metrics-over-time';
import { getIntensityMetricsOverTime } from '@/features/training/get-intensity-metrics-over-time';
import { getSpeedMetricsOverTime } from '@/features/training/get-speed-metrics-over-time';
import date from '@/lib/date';

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

export function DashboardMetricsTabContent() {
    const speedData = getSpeedMetricsOverTime(trainings);
    const distanceData = getDistanceMetricsOverTime(trainings);
    const elevationData = getElevationMetricsOverTime(trainings);
    const intensityData = getIntensityMetricsOverTime(trainings);

    // Format the date for better display
    const formatData = (data: any[]) => {
        return data.map((item) => ({
            ...item,
            formattedDate: date(item.date).format('MMM YYYY')
        }));
    };

    const formattedSpeedData = formatData(speedData);
    const formattedDistanceData = formatData(distanceData);
    const formattedElevationData = formatData(elevationData);
    const formattedIntensityData = formatData(intensityData);

    const chartConfig = {
        average: {
            label: 'Średnia prędkość',
            color: '#4f46e5'
        },
        maximum: {
            label: 'Prędkość maksymalna',
            color: '#ef4444'
        },
        distance: {
            label: 'Dystans (km)',
            color: '#10b981'
        },
        cumulative: {
            label: 'Łączny dystans (km)',
            color: '#6366f1'
        },
        elevation: {
            label: 'Przewyższenie (m)',
            color: '#f59e0b'
        },
        elevationPerKm: {
            label: 'Przewyższenie na km',
            color: '#8b5cf6'
        },
        intensity: {
            label: 'Intensywność',
            color: '#ec4899'
        },
        distance_contribution: {
            label: 'Dystans',
            color: '#10b981'
        },
        speed_contribution: {
            label: 'Prędkość',
            color: '#4f46e5'
        },
        hr_contribution: {
            label: 'Tętno',
            color: '#ef4444'
        },
        elevation_contribution: {
            label: 'Przewyższenie',
            color: '#f59e0b'
        }
    };

    return (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-2'>
            <Card>
                <CardHeader>
                    <CardTitle>Prędkość w czasie</CardTitle>
                    <CardDescription>Średnia i maksymalna prędkość podczas treningów</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className='aspect-auto h-80'>
                        <LineChart data={formattedSpeedData}>
                            <CartesianGrid strokeDasharray='3 3' />
                            <XAxis dataKey='formattedDate' tickLine={false} axisLine={false} />
                            <YAxis
                                label={{ value: 'km/h', angle: -90, position: 'insideLeft' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <ChartTooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <ChartTooltipContent
                                                className='w-[250px]'
                                                payload={payload}
                                                active={active}
                                            />
                                        );
                                    }

                                    return null;
                                }}
                            />
                            <Line
                                name='average'
                                type='monotone'
                                dataKey='avgSpeed'
                                stroke={chartConfig.average.color}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                name='maximum'
                                type='monotone'
                                dataKey='maxSpeed'
                                stroke={chartConfig.maximum.color}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                            <ChartLegend
                                content={({ payload }) => {
                                    if (payload && payload.length) {
                                        return <ChartLegendContent payload={payload} />;
                                    }

                                    return null;
                                }}
                            />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Dystans w czasie</CardTitle>
                    <CardDescription>Dystans poszczególnych treningów i łączny przejechany dystans</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className='aspect-auto h-80'>
                        <BarChart data={formattedDistanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray='3 3' />
                            <XAxis dataKey='formattedDate' tickLine={false} axisLine={false} />
                            <YAxis
                                yAxisId='left'
                                orientation='left'
                                label={{ value: 'km (trening)', angle: -90, position: 'insideLeft' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                yAxisId='right'
                                orientation='right'
                                label={{ value: 'km (łącznie)', angle: 90, position: 'insideRight' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <ChartTooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <ChartTooltipContent
                                                className='w-[250px]'
                                                payload={payload}
                                                active={active}
                                            />
                                        );
                                    }

                                    return null;
                                }}
                            />
                            <Bar name='distance' dataKey='distance' yAxisId='left' fill={chartConfig.distance.color} />
                            <Line
                                name='cumulative'
                                type='monotone'
                                dataKey='cumulativeDistance'
                                yAxisId='right'
                                stroke={chartConfig.cumulative.color}
                                strokeWidth={2}
                                dot={{ r: 4 }}
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

            <Card>
                <CardHeader>
                    <CardTitle>Przewyższenie w czasie</CardTitle>
                    <CardDescription>Całkowite przewyższenie i przewyższenie na kilometr</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className='aspect-auto h-80'>
                        <AreaChart data={formattedElevationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray='3 3' />
                            <XAxis dataKey='formattedDate' tickLine={false} axisLine={false} />
                            <YAxis
                                yAxisId='left'
                                orientation='left'
                                label={{ value: 'm', angle: -90, position: 'insideLeft' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                yAxisId='right'
                                orientation='right'
                                label={{ value: 'm/km', angle: 90, position: 'insideRight' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <ChartTooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <ChartTooltipContent
                                                className='w-[250px]'
                                                payload={payload}
                                                active={active}
                                            />
                                        );
                                    }

                                    return null;
                                }}
                            />
                            <Area
                                name='elevation'
                                type='monotone'
                                dataKey='elevationGain'
                                yAxisId='left'
                                fill={chartConfig.elevation.color}
                                stroke={chartConfig.elevation.color}
                                fillOpacity={0.3}
                            />
                            <Line
                                name='elevationPerKm'
                                type='monotone'
                                dataKey='elevationPerKm'
                                yAxisId='right'
                                stroke={chartConfig.elevationPerKm.color}
                                strokeWidth={2}
                                dot={{ r: 4 }}
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

            <Card>
                <CardHeader>
                    <CardTitle>Intensywność treningu</CardTitle>
                    <CardDescription>Wskaźnik intensywności treningów (0-100)</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className='aspect-auto h-80'>
                        <BarChart data={formattedIntensityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray='3 3' />
                            <XAxis dataKey='formattedDate' tickLine={false} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
                            <ChartTooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <ChartTooltipContent
                                                className='w-[250px]'
                                                payload={payload.map((p) => ({
                                                    ...p,
                                                    value: p.value,
                                                    name:
                                                        p.dataKey === 'intensity'
                                                            ? chartConfig.intensity.label
                                                            : p.dataKey === 'distanceContribution'
                                                              ? chartConfig.distance_contribution.label
                                                              : p.dataKey === 'speedContribution'
                                                                ? chartConfig.speed_contribution.label
                                                                : p.dataKey === 'heartRateContribution'
                                                                  ? chartConfig.hr_contribution.label
                                                                  : p.dataKey === 'elevationContribution'
                                                                    ? chartConfig.elevation_contribution.label
                                                                    : p.name
                                                }))}
                                                active={active}
                                            />
                                        );
                                    }

                                    return null;
                                }}
                            />
                            <Bar name='intensity' dataKey='intensity' fill={chartConfig.intensity.color} stackId='a' />
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
        </div>
    );
}
