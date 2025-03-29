import { StatsCard } from '@/components/stats-card';
import trainings from '@/data/trainings.json';
import { calculateAverageHeartRate } from '@/features/training/calculate-average-heart-rate';
import { calculateAverageSpeed } from '@/features/training/calculate-average-speed';
import { calculateHighestAverageSpeed } from '@/features/training/calculate-highest-average-speed';
import { calculateTrend, getTrendMessage } from '@/features/training/calculate-trend';
import { Training } from '@/types/training';

import dayjs from 'dayjs';
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

export function DashboardGlobalStatsTabContent() {
    const highestAvgSpeed = calculateHighestAverageSpeed(trainings);

    const totalDistanceTrend = calculateTrend(trainings, (t: Training) => t.distance_km);
    const totalElevationTrend = calculateTrend(trainings, (t: Training) => t.elevation_gain_m);
    const highestAvgSpeedTrend = calculateTrend(trainings, (t: Training) => t.avg_speed_kmh, 3, 3);

    const maxDistanceTrend = calculateTrend(
        trainings,
        (t: Training) => t.distance_km,
        3,
        3,
        (recentTrainings: Training[], olderTrainings: Training[]) => {
            if (recentTrainings.length === 0 || olderTrainings.length === 0) return 0;

            const recentMax = Math.max(...recentTrainings.map((t) => t.distance_km));
            const olderMax = Math.max(...olderTrainings.map((t) => t.distance_km));

            if (olderMax === 0) return recentMax > 0 ? 100 : 0;

            return ((recentMax - olderMax) / olderMax) * 100;
        }
    );

    const maxHeartRateTrend = calculateTrend(
        trainings,
        (t: Training) => t.avg_heart_rate_bpm,
        3,
        3,
        (recentTrainings: Training[], olderTrainings: Training[]) => {
            if (recentTrainings.length === 0 || olderTrainings.length === 0) return 0;

            const validRecentHR = recentTrainings.filter((t) => t.avg_heart_rate_bpm > 0);
            const validOlderHR = olderTrainings.filter((t) => t.avg_heart_rate_bpm > 0);

            if (validRecentHR.length === 0 || validOlderHR.length === 0) return 0;

            const recentMax = Math.max(...validRecentHR.map((t) => t.avg_heart_rate_bpm));
            const olderMax = Math.max(...validOlderHR.map((t) => t.avg_heart_rate_bpm));

            if (olderMax === 0) return recentMax > 0 ? 100 : 0;

            return ((recentMax - olderMax) / olderMax) * 100;
        }
    );

    const timePerKmTrend = calculateTrend(
        trainings,
        (t: Training) => {
            const [hours, minutes] = t.moving_time.split(':').map(Number);
            const totalHours = hours + minutes / 60;

            return totalHours / t.distance_km;
        },
        3,
        3
    );

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
                        value={trainings.reduce((acc, training) => acc + training.distance_km, 0)}
                        unit='km'
                        infoText={`Na podstawie ${trainings.length} treningów`}
                        formatValue={(val) => val.toFixed(0)}
                    />

                    <StatsCard
                        title='Łączny dystans w 2025 roku'
                        value={trainings.reduce((acc, training) => {
                            const trainingDate = dayjs(training.date);

                            return trainingDate.isAfter(dayjs('2025-01-01')) ? acc + training.distance_km : acc;
                        }, 0)}
                        unit='km'
                        infoText={`Na podstawie ${trainings.length} treningów`}
                        formatValue={(val) => val.toFixed(0)}
                    />

                    <StatsCard
                        title='Najwyższy dystans'
                        value={Math.max(...trainings.map((training) => training.distance_km))}
                        unit='km'
                        infoText='Najdłuższy pojedynczy trening'
                        formatValue={(val) => val.toFixed(1)}
                    />
                </div>
            </section>

            <section>
                <h2 className='mb-4 text-xl font-semibold'>Wysokość</h2>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    <StatsCard
                        title='Łączne przewyższenie'
                        value={trainings.reduce((acc, training) => acc + training.elevation_gain_m, 0)}
                        unit='m'
                        infoText={`Na podstawie ${trainings.length} treningów`}
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
                        infoText={`Na podstawie ${trainings.length} treningów`}
                    />

                    <StatsCard
                        title='Najszybszy kilometr'
                        value={Math.min(
                            ...trainings.map((training) => {
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
                        value={Math.max(...trainings.map((training) => training.avg_heart_rate_bpm))}
                        unit='bpm'
                        infoText='Najwyższe średnie tętno na treningu'
                        formatValue={(val) => val.toFixed(0)}
                    />
                </div>
            </section>
        </div>
    );
}
