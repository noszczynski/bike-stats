import { StatsCard } from '@/components/stats-card';
import { TrainingHistoryTable } from '@/components/training-history-table';
import trainings from '@/data/trainings.json';
import { calculateAverageHeartRate } from '@/features/training/calculate-average-heart-rate';
import { calculateAverageSpeed } from '@/features/training/calculate-average-speed';
import { calculateHighestAverageSpeed } from '@/features/training/calculate-highest-average-speed';
import { calculateMaxSpeed } from '@/features/training/calculate-max-speed';
import { calculateTrend, getTrendMessage } from '@/features/training/calculate-trend';
import { Training } from '@/types/training';

import dayjs from 'dayjs';
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

export const DashboardOverviewTabContent = () => {
    const avgSpeed = calculateAverageSpeed(trainings);
    const maxSpeed = calculateMaxSpeed(trainings);
    const avgHeartRate = calculateAverageHeartRate(trainings);
    const highestAvgSpeed = calculateHighestAverageSpeed(trainings);

    // Calculate trend percentages for each stat
    const avgSpeedTrend = calculateTrend(trainings, (t: Training) => t.avg_speed_kmh);
    const maxSpeedTrend = calculateTrend(trainings, (t: Training) => t.max_speed_kmh);
    const avgHeartRateTrend = calculateTrend(trainings, (t: Training) => t.avg_heart_rate_bpm);
    const highestAvgSpeedTrend = calculateTrend(trainings, (t: Training) => t.avg_speed_kmh, 3, 3);

    const totalDistanceTrend = calculateTrend(trainings, (t: Training) => t.distance_km);

    const totalElevationTrend = calculateTrend(trainings, (t: Training) => t.elevation_gain_m);

    const avgTimeTrend = calculateTrend(trainings, (t: Training) => {
        const [hours, minutes] = t.moving_time.split(':').map(Number);

        return hours + minutes / 60;
    });

    const trainingCountTrend = calculateTrend(
        trainings,
        () => 1 // Count each training as 1
    );

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

    const avgTimePerKmTrend = calculateTrend(trainings, (t: Training) => {
        const [hours, minutes] = t.moving_time.split(':').map(Number);
        const totalHours = hours + minutes / 60;

        return totalHours / t.distance_km;
    });

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
        <div className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
                <StatsCard
                    title='Średnia prędkość'
                    value={avgSpeed}
                    unit='km/h'
                    trend={formatTrend(avgSpeedTrend)}
                    trendIcon={getTrendIcon(avgSpeedTrend)}
                    trendMessage={getTrendMessage(avgSpeedTrend)}
                    trendProgress={getTrendProgress(avgSpeedTrend)}
                    infoText={`Na podstawie ${trainings.length} treningów`}
                />

                <StatsCard
                    title='Maksymalna prędkość'
                    value={maxSpeed}
                    unit='km/h'
                    trend={formatTrend(maxSpeedTrend)}
                    trendIcon={getTrendIcon(maxSpeedTrend)}
                    trendMessage={getTrendMessage(maxSpeedTrend)}
                    trendProgress={getTrendProgress(maxSpeedTrend)}
                    infoText={`Na podstawie ${trainings.length} treningów`}
                />

                <StatsCard
                    title='Średni Heart Rate na trening'
                    value={avgHeartRate}
                    unit='bpm'
                    trend={formatTrend(avgHeartRateTrend)}
                    trendIcon={getTrendIcon(avgHeartRateTrend)}
                    trendMessage={getTrendMessage(avgHeartRateTrend)}
                    trendProgress={getTrendProgress(avgHeartRateTrend)}
                    infoText={`Na podstawie ${trainings.length} treningów`}
                    formatValue={(val) => val.toFixed(0)}
                />

                {/* Moved to global stats */}
                {/* <StatsCard
                    title='Najwyższa średnia prędkość'
                    value={highestAvgSpeed}
                    unit='km/h'
                    trend={formatTrend(highestAvgSpeedTrend)}
                    trendIcon={getTrendIcon(highestAvgSpeedTrend)}
                    trendMessage={getTrendMessage(highestAvgSpeedTrend)}
                    trendProgress={getTrendProgress(highestAvgSpeedTrend)}
                    infoText={`Na podstawie ${trainings.length} treningów`}
                /> */}

                {/* TODO: Add this card back in in global stats */}
                {/* <StatsCard
                    title='Łączny dystans'
                    value={trainings.reduce((acc, training) => acc + training.distance_km, 0)}
                    unit='km'
                    trend={formatTrend(totalDistanceTrend)}
                    trendIcon={getTrendIcon(totalDistanceTrend)}
                    trendMessage={getTrendMessage(totalDistanceTrend)}
                    trendProgress={getTrendProgress(totalDistanceTrend)}
                    infoText={`Na podstawie ${trainings.length} treningów`}
                    formatValue={(val) => val.toFixed(0)}
                /> */}

                {/* TODO: Add this card back in in global stats */}
                {/* <StatsCard
                    title='Łączny dystans w 2025 roku'
                    value={trainings.reduce((acc, training) => {
                        const trainingDate = dayjs(training.date);

                        return trainingDate.isAfter(dayjs('2025-01-01')) ? acc + training.distance_km : acc;
                    }, 0)}
                    unit='km'
                    trend={formatTrend(
                        calculateTrend(
                            trainings.filter((t) => dayjs(t.date).isAfter(dayjs('2025-01-01'))),
                            (t: Training) => t.distance_km
                        )
                    )}
                    trendIcon={getTrendIcon(
                        calculateTrend(
                            trainings.filter((t) => dayjs(t.date).isAfter(dayjs('2025-01-01'))),
                            (t: Training) => t.distance_km
                        )
                    )}
                    trendMessage={getTrendMessage(
                        calculateTrend(
                            trainings.filter((t) => dayjs(t.date).isAfter(dayjs('2025-01-01'))),
                            (t: Training) => t.distance_km
                        )
                    )}
                    trendProgress={getTrendProgress(
                        calculateTrend(
                            trainings.filter((t) => dayjs(t.date).isAfter(dayjs('2025-01-01'))),
                            (t: Training) => t.distance_km
                        )
                    )}
                    infoText={`Na podstawie ${trainings.filter((t) => dayjs(t.date).isAfter(dayjs('2025-01-01'))).length} treningów`}
                    formatValue={(val) => val.toFixed(0)}
                /> */}

                <StatsCard
                    title='Średnie przewyższenie na trening'
                    value={trainings.reduce((acc, training) => acc + training.elevation_gain_m, 0) / trainings.length}
                    unit='m'
                    trend={formatTrend(totalElevationTrend)}
                    trendIcon={getTrendIcon(totalElevationTrend)}
                    trendMessage={getTrendMessage(totalElevationTrend)}
                    trendProgress={getTrendProgress(totalElevationTrend)}
                    infoText={`Na podstawie ${trainings.length} treningów`}
                    formatValue={(val) => val.toFixed(0)}
                />

                {/* TODO: Add this card back in in global stats */}
                {/* <StatsCard
                    title='Łączne przewyższenie'
                    value={trainings.reduce((acc, training) => acc + training.elevation_gain_m, 0)}
                    unit='m'
                    trend={formatTrend(totalElevationTrend)}
                    trendIcon={getTrendIcon(totalElevationTrend)}
                    trendMessage={getTrendMessage(totalElevationTrend)}
                    trendProgress={getTrendProgress(totalElevationTrend)}
                    infoText={`Na podstawie ${trainings.length} treningów`}
                    formatValue={(val) => val.toFixed(0)}
                /> */}

                <StatsCard
                    title='Średni czas jazdy na trening'
                    value={
                        trainings.reduce((acc, training) => {
                            const [hours, minutes] = training.moving_time.split(':').map(Number);

                            return acc + hours + minutes / 60;
                        }, 0) / trainings.length
                    }
                    unit='h'
                    trend={formatTrend(avgTimeTrend)}
                    trendIcon={getTrendIcon(avgTimeTrend)}
                    trendMessage={getTrendMessage(avgTimeTrend)}
                    trendProgress={getTrendProgress(avgTimeTrend)}
                    infoText={`Na podstawie ${trainings.length} treningów`}
                    formatValue={(val) => val.toFixed(1)}
                />

                {/* Moved to global stats */}
                {/* <StatsCard
                    title='Najwyższy dystans'
                    value={Math.max(...trainings.map((training) => training.distance_km))}
                    unit='km'
                    trend={formatTrend(maxDistanceTrend)}
                    trendIcon={getTrendIcon(maxDistanceTrend)}
                    trendMessage={getTrendMessage(maxDistanceTrend)}
                    trendProgress={getTrendProgress(maxDistanceTrend)}
                    infoText='Najdłuższy pojedynczy trening'
                    formatValue={(val) => val.toFixed(1)}
                /> */}

                {/* Moved to global stats */}
                {/* <StatsCard
                    title='Najwyższy średni HR'
                    value={Math.max(...trainings.map((training) => training.avg_heart_rate_bpm))}
                    unit='bpm'
                    trend={formatTrend(maxHeartRateTrend)}
                    trendIcon={getTrendIcon(maxHeartRateTrend)}
                    trendMessage={getTrendMessage(maxHeartRateTrend)}
                    trendProgress={getTrendProgress(maxHeartRateTrend)}
                    infoText='Najwyższe średnie tętno na treningu'
                    formatValue={(val) => val.toFixed(0)}
                /> */}

                {/* Moved to global stats */}
                {/* <StatsCard
                    title='Najszybszy kilometr'
                    value={Math.min(
                        ...trainings.map((training) => {
                            const [hours, minutes] = training.moving_time.split(':').map(Number);
                            const totalHours = hours + minutes / 60;

                            return totalHours / training.distance_km;
                        })
                    )}
                    unit='min/km'
                    trend={formatTrend(timePerKmTrend * -1)} // Negate because lower times are better
                    trendIcon={getTrendIcon(timePerKmTrend * -1, false)} // Lower is better for time
                    trendMessage={getTrendMessage(timePerKmTrend * -1, false)} // Lower is better for time
                    trendProgress={getTrendProgress(timePerKmTrend * -1, false)} // Lower is better for time
                    infoText='Najszybszy średni czas na kilometr'
                    formatValue={(val) => (val * 60).toFixed(1)}
                /> */}

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
                    trend={formatTrend(avgTimePerKmTrend * -1)} // Negate because lower times are better
                    trendIcon={getTrendIcon(avgTimePerKmTrend * -1, false)} // Lower is better for time
                    trendMessage={getTrendMessage(avgTimePerKmTrend * -1, false)} // Lower is better for time
                    trendProgress={getTrendProgress(avgTimePerKmTrend * -1, false)} // Lower is better for time
                    infoText='Średni czas na kilometr we wszystkich treningach'
                    formatValue={(val) => (val * 60).toFixed(1)}
                />
            </div>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
                <TrainingHistoryTable />
            </div>
        </div>
    );
};
