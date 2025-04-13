import { cookies } from 'next/headers';

import { StatsCard } from '@/components/stats-card';
import { TrainingHistoryTable } from '@/components/training-history-table';
import { calculateAverageHeartRate } from '@/features/training/calculate-average-heart-rate';
import { calculateAverageSpeed } from '@/features/training/calculate-average-speed';
import { calculateMaxSpeed } from '@/features/training/calculate-max-speed';
import { getAllTrainings } from '@/lib/api/trainings';

export async function DashboardOverviewTabContent() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('strava_access_token')?.value;
    const refreshToken = cookieStore.get('strava_refresh_token')?.value;

    if (!accessToken || !refreshToken) {
        return <div>No access token or refresh token found</div>;
    }

    const trainings = await getAllTrainings(accessToken, refreshToken);

    const avgSpeed = calculateAverageSpeed(trainings);
    const maxSpeed = calculateMaxSpeed(trainings);
    const avgHeartRate = calculateAverageHeartRate(trainings);

    return (
        <div className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
                <StatsCard
                    title='Średnia prędkość'
                    value={avgSpeed}
                    unit='km/h'
                    infoText={`Na podstawie ${trainings.length} treningów`}
                />

                <StatsCard
                    title='Maksymalna prędkość'
                    value={maxSpeed}
                    unit='km/h'
                    infoText={`Na podstawie ${trainings.length} treningów`}
                />

                <StatsCard
                    title='Średni Heart Rate na trening'
                    value={avgHeartRate}
                    unit='bpm'
                    infoText={`Na podstawie ${trainings.length} treningów`}
                    formatValue={(val) => val.toFixed(0)}
                />

                <StatsCard
                    title='Średnie przewyższenie na trening'
                    value={trainings.reduce((acc, training) => acc + training.elevation_gain_m, 0) / trainings.length}
                    unit='m'
                    infoText={`Na podstawie ${trainings.length} treningów`}
                    formatValue={(val) => val.toFixed(0)}
                />

                <StatsCard
                    title='Średni czas jazdy na trening'
                    value={
                        trainings.reduce((acc, training) => {
                            const [hours, minutes] = training.moving_time.split(':').map(Number);

                            return acc + hours + minutes / 60;
                        }, 0) / trainings.length
                    }
                    unit='h'
                    infoText={`Na podstawie ${trainings.length} treningów`}
                    formatValue={(val) => val.toFixed(1)}
                />

                <StatsCard
                    title='Średni czas na km'
                    value={
                        trainings.reduce((acc, training) => {
                            const [hours, minutes] = training.moving_time.split(':').map(Number);
                            const totalHours = hours + minutes / 60;

                            return acc + totalHours / training.distance_km;
                        }, 0) / trainings.length
                    }
                    unit='min/km'
                    infoText='Średni czas na kilometr we wszystkich treningach'
                    formatValue={(val) => (val * 60).toFixed(1)}
                />
            </div>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
                <TrainingHistoryTable />
            </div>
        </div>
    );
}
