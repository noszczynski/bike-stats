import React from 'react';

import { TrainingOverview } from '@/components/training-overview';
import { getAllTrainings } from '@/lib/api/trainings';
import date from '@/lib/date';
import { cookies } from 'next/headers';

export async function DashboardLastTrainingTabContent() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('strava_access_token')?.value;
    const refreshToken = cookieStore.get('strava_refresh_token')?.value;

    if (!accessToken || !refreshToken) {
        return <div>No access token or refresh token found</div>;
    }

    const allTrainings = await getAllTrainings(accessToken, refreshToken);

    // Make sure trainings are sorted by date (newest first)
    const sortedTrainings = [...allTrainings].sort((a, b) => date(b.date).valueOf() - date(a.date).valueOf());

    // Get the latest training
    const lastTraining = sortedTrainings[0];

    // Check if we have a training
    if (!lastTraining) {
        return (
            <div className='flex h-[600px] items-center justify-center'>
                <div className='text-center'>
                    <h3 className='text-2xl font-bold'>Brak danych</h3>
                    <p className='text-muted-foreground mt-2'>Dodaj swój pierwszy trening</p>
                </div>
            </div>
        );
    }

    return <TrainingOverview training={lastTraining} compareTo='earlier' allTrainings={allTrainings} />;
}
