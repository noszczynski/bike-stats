'use client';

import React from 'react';

import { DistanceChart } from '@/components/charts/distance-chart';
import { ElevationChart } from '@/components/charts/elevation-chart';
import { IntensityChart } from '@/components/charts/intensity-chart';
import { SpeedChart } from '@/components/charts/speed-chart';
import trainings from '@/data/trainings.json';
import { getDistanceMetricsOverTime } from '@/features/training/get-distance-metrics-over-time';
import { getElevationMetricsOverTime } from '@/features/training/get-elevation-metrics-over-time';
import { getIntensityMetricsOverTime } from '@/features/training/get-intensity-metrics-over-time';
import { getSpeedMetricsOverTime } from '@/features/training/get-speed-metrics-over-time';
import date from '@/lib/date';
import { Training } from '@/types/training';

export function DashboardMetricsTabContent() {
    const speedData = getSpeedMetricsOverTime(trainings as Training[]);
    const distanceData = getDistanceMetricsOverTime(trainings as Training[]);
    const elevationData = getElevationMetricsOverTime(trainings as Training[]);
    const intensityData = getIntensityMetricsOverTime(trainings as Training[]);

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

    return (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-2'>
            <SpeedChart data={formattedSpeedData} />
            <DistanceChart data={formattedDistanceData} />
            <ElevationChart data={formattedElevationData} />
            <IntensityChart data={formattedIntensityData} />
        </div>
    );
}
