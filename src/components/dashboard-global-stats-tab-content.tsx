import { StatsCard } from '@/components/stats-card';
import { calculateHighestAverageSpeed } from '@/features/training/calculate-highest-average-speed';
import { getAllTrainings } from '@/lib/api/trainings';
import date from '@/lib/date';

import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { cookies } from 'next/headers';

export async function DashboardGlobalStatsTabContent() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('strava_access_token')?.value;
    const refreshToken = cookieStore.get('strava_refresh_token')?.value;

    if (!accessToken || !refreshToken) {
        return <div>No access token or refresh token found</div>;
    }

    const allTrainings = await getAllTrainings(accessToken, refreshToken);

    const highestAvgSpeed = calculateHighestAverageSpeed(allTrainings);

    // Helper function to get the appropriate icon based on trend
    const getTrendIcon = (trend: number, positiveIsBetter = true) => {
        if (trend === 0) return undefined;
        const isPositive = trend > 0;
        const isImprovement = (positiveIsBetter && isPositive) || (!positiveIsBetter && !isPositive);

        return isImprovement ? TrendingUpIcon : TrendingDownIcon;
    };

    // Helper function to get progress status based on trend
    const getTrendProgress = (trend: number, positiveIsBetter = true): 'progress' | 'regress' | 'neutral' => {
        if (trend === 0) return 'neutral';
        const isPositive = trend > 0;
        const isImprovement = (positiveIsBetter && isPositive) || (!positiveIsBetter && !isPositive);

        return isImprovement ? 'progress' : 'regress';
    };

    // Helper function to format trend as string
    const formatTrend = (trend: number) => {
        return `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`;
    };

    return (
        <div className='space-y-8'>
            <section>
                <h2 className='mb-4 text-xl font-semibold'>Odległość</h2>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    <StatsCard
                        title='Łączny dystans'
                        value={allTrainings.reduce((acc, training) => acc + training.distance_km, 0)}
                        unit='km'
                        infoText={`Na podstawie ${allTrainings.length} treningów`}
                        formatValue={(val) => val.toFixed(0)}
                    />

                    <StatsCard
                        title='Łączny dystans w 2025 roku'
                        value={allTrainings.reduce((acc, training) => {
                            const trainingDate = date(training.date);

                            return trainingDate.isAfter(date('2025-01-01')) ? acc + training.distance_km : acc;
                        }, 0)}
                        unit='km'
                        infoText={`Na podstawie ${allTrainings.length} treningów`}
                        formatValue={(val) => val.toFixed(0)}
                    />

                    <StatsCard
                        title='Najwyższy dystans'
                        value={Math.max(...allTrainings.map((training) => training.distance_km))}
                        unit='km'
                        infoText='Najdłuższy pojedynczy trening'
                        formatValue={(val) => val.toFixed(1)}
                    />

                    <StatsCard
                        title='Średni dystans treningu'
                        value={
                            allTrainings.length > 0
                                ? allTrainings.reduce((acc, training) => acc + training.distance_km, 0) / allTrainings.length
                                : 0
                        }
                        unit='km'
                        infoText='Przeciętny dystans na trening'
                        formatValue={(val) => val.toFixed(1)}
                    />
                </div>
            </section>

            <section>
                <h2 className='mb-4 text-xl font-semibold'>Wysokość</h2>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    <StatsCard
                        title='Łączne przewyższenie'
                        value={allTrainings.reduce((acc, training) => acc + training.elevation_gain_m, 0)}
                        unit='m'
                        infoText={`Na podstawie ${allTrainings.length} treningów`}
                        formatValue={(val) => val.toFixed(0)}
                    />
                </div>
            </section>

            <section>
                <h2 className='mb-4 text-xl font-semibold'>Prędkość</h2>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    <StatsCard
                        title='Najwyższa średnia prędkość'
                        value={highestAvgSpeed}
                        unit='km/h'
                        infoText={`Na podstawie ${allTrainings.length} treningów`}
                    />

                    <StatsCard
                        title='Najszybszy kilometr'
                        value={Math.min(
                            ...allTrainings.map((training) => {
                                const [hours, minutes] = training.moving_time.split(':').map(Number);
                                const totalHours = hours + minutes / 60;

                                return totalHours / training.distance_km;
                            })
                        )}
                        unit='min/km'
                        infoText='Najszybszy średni czas na kilometr'
                        formatValue={(val) => (val * 60).toFixed(1)}
                    />
                </div>
            </section>

            <section>
                <h2 className='mb-4 text-xl font-semibold'>Tętno</h2>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    <StatsCard
                        title='Najwyższy średni HR'
                        value={Math.max(
                            ...allTrainings.map((training) => training.avg_heart_rate_bpm || 0).filter((hr) => hr > 0)
                        )}
                        unit='bpm'
                        infoText='Najwyższe średnie tętno na treningu'
                        formatValue={(val) => val.toFixed(0)}
                    />
                </div>
            </section>
        </div>
    );
}
