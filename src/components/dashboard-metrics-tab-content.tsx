'use client';

import React from 'react';

import { DistanceChart } from '@/components/charts/distance-chart';
import { ElevationChart } from '@/components/charts/elevation-chart';
import { IntensityChart } from '@/components/charts/intensity-chart';
import { SpeedChart } from '@/components/charts/speed-chart';

export function DashboardMetricsTabContent() {
    return (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-2'>
            <SpeedChart />
            <DistanceChart />
            <ElevationChart />
            <IntensityChart />
        </div>
    );
}
