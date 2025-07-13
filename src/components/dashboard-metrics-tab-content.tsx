import React from 'react';



import { cookies } from 'next/headers';



import { DistanceChart } from '@/components/charts/distance-chart';
import { ElevationChart } from '@/components/charts/elevation-chart';
import { HeartRateChart } from '@/components/charts/heart-rate-chart';
import { HeartRateTimeChart } from '@/components/charts/heart-rate-time-chart';
import { IntensityChart } from '@/components/charts/intensity-chart';
import { PaceChart } from '@/components/charts/pace-chart';
import { YearlyDistanceChart } from '@/components/charts/yearly-distance-chart';
import { getAllTrainings } from '@/lib/api/trainings';



import { AverageSpeedPerKilometrChart } from './charts/average-speed-per-kilometr-chart';





export async function DashboardMetricsTabContent() {
    const { trainings } = await getAllTrainings();

    return (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-2'>
            <HeartRateChart trainings={trainings} />
            <HeartRateTimeChart trainings={trainings} />
            <AverageSpeedPerKilometrChart trainings={trainings} />
            <PaceChart trainings={trainings} />
            <DistanceChart trainings={trainings} />
            <ElevationChart trainings={trainings} />
            <IntensityChart trainings={trainings} />
            <YearlyDistanceChart trainings={trainings} />
        </div>
    );
}
