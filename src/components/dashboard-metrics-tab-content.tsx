import React from 'react';

import { cookies } from 'next/headers';

import { getAllStravaRideActivities } from '@/lib/api/strava';
import { DistanceChart } from '@/components/charts/distance-chart';
import { ElevationChart } from '@/components/charts/elevation-chart';
import { HeartRateChart } from '@/components/charts/heart-rate-chart';
import { IntensityChart } from '@/components/charts/intensity-chart';
import { getAllTrainings } from '@/lib/api/trainings';

import { AverageSpeedPerKilometrChart } from './charts/average-speed-per-kilometr-chart';

export async function DashboardMetricsTabContent() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('strava_access_token')?.value;
    const refreshToken = cookieStore.get('strava_refresh_token')?.value;

    if (!accessToken || !refreshToken) {
        return <div>No access token or refresh token found</div>;
    }

    const trainings = await getAllTrainings(accessToken, refreshToken);
    const sa = await getAllStravaRideActivities(accessToken, refreshToken, {
        per_page: 100
    });

    return (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-2'>
            <HeartRateChart trainings={trainings} />
            <AverageSpeedPerKilometrChart trainings={trainings} />
            <DistanceChart trainings={trainings} />
            <ElevationChart trainings={trainings} />
            <IntensityChart trainings={trainings} />
        </div>
    );
}
