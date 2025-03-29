import React from 'react';

import { StatsCard } from '@/components/stats-card';
import trainings from '@/data/trainings.json';
import {
    MetricType,
    formatTrend,
    getTrendIcon,
    getTrendMessage,
    getTrendProgress
} from '@/features/training/trend-utils';
import date from '@/lib/date';

type Training = (typeof trainings)[0];

type TrainingOverviewProps = {
    training: Training;
    compareTo: 'all' | 'earlier' | 'other';
};

export function TrainingOverview({ training, compareTo }: TrainingOverviewProps) {
    // Make sure trainings are sorted by date (newest first)
    const sortedTrainings = [...trainings].sort((a, b) => date(b.date).valueOf() - date(a.date).valueOf());

    // Get all trainings to compare against
    let compareTrainings: Training[] = [];

    if (compareTo === 'all') {
        // Compare to all trainings except the current one
        compareTrainings = sortedTrainings.filter((t) => t.date !== training.date);
    } else if (compareTo === 'earlier') {
        // Compare to trainings that happened before this one
        compareTrainings = sortedTrainings.filter((t) => date(t.date).isBefore(date(training.date)));
    } else if (compareTo === 'other') {
        // Compare to all other trainings (same as 'all')
        compareTrainings = sortedTrainings.filter((t) => t.date !== training.date);
    }

    // Perform comparisons only if we have data to compare
    if (compareTrainings.length === 0) {
        return (
            <div className='flex h-[600px] items-center justify-center'>
                <div className='text-center'>
                    <h3 className='text-2xl font-bold'>Brak danych do porównania</h3>
                    <p className='text-muted-foreground mt-2'>Potrzebny jest co najmniej jeden wcześniejszy trening</p>
                </div>
            </div>
        );
    }

    // Calculate average of past trainings
    const avgDistancePast = compareTrainings.reduce((acc, t) => acc + t.distance_km, 0) / compareTrainings.length;
    const avgElevationPast = compareTrainings.reduce((acc, t) => acc + t.elevation_gain_m, 0) / compareTrainings.length;
    const avgSpeedPast = compareTrainings.reduce((acc, t) => acc + t.avg_speed_kmh, 0) / compareTrainings.length;
    const avgMaxSpeedPast = compareTrainings.reduce((acc, t) => acc + t.max_speed_kmh, 0) / compareTrainings.length;

    // Calculate average heart rate for past trainings (ignoring zeroes)
    const validHeartRateTrainings = compareTrainings
        .filter((t) => t.avg_heart_rate_bpm !== null)
        .filter((t) => t.avg_heart_rate_bpm > 0);

    const avgHeartRatePast =
        validHeartRateTrainings.length > 0
            ? validHeartRateTrainings.reduce((acc, t) => acc + (t.avg_heart_rate_bpm || 0), 0) /
              validHeartRateTrainings.length
            : 0;

    // Average time calculation
    const avgTimePast =
        compareTrainings.reduce((acc, t) => {
            const [hours, minutes] = t.moving_time.split(':').map(Number);

            return acc + hours + minutes / 60;
        }, 0) / compareTrainings.length;

    // Calculate average time per km
    const avgTimePerKmPast =
        compareTrainings.reduce((acc, t) => {
            const [hours, minutes] = t.moving_time.split(':').map(Number);
            const totalHours = hours + minutes / 60;

            return acc + totalHours / t.distance_km;
        }, 0) / compareTrainings.length;

    // Calculate percentage differences
    const calcPercentageDiff = (current: number, past: number) => {
        if (past === 0) return 0;

        return ((current - past) / past) * 100;
    };

    const distanceDiff = calcPercentageDiff(training.distance_km, avgDistancePast);
    const elevationDiff = calcPercentageDiff(training.elevation_gain_m, avgElevationPast);
    const speedDiff = calcPercentageDiff(training.avg_speed_kmh, avgSpeedPast);
    const maxSpeedDiff = calcPercentageDiff(training.max_speed_kmh, avgMaxSpeedPast);
    const heartRateDiff =
        training.avg_heart_rate_bpm !== null && training.avg_heart_rate_bpm > 0 && avgHeartRatePast > 0
            ? calcPercentageDiff(training.avg_heart_rate_bpm, avgHeartRatePast)
            : 0;

    // Calculate moving time difference
    const [lastHours, lastMinutes] = training.moving_time.split(':').map(Number);
    const lastTotalHours = lastHours + lastMinutes / 60;
    const timeDiff = calcPercentageDiff(lastTotalHours, avgTimePast);

    // Calculate time per km difference (lower is better, so we negate the difference)
    const lastTimePerKm = lastTotalHours / training.distance_km;
    const timePerKmDiff = calcPercentageDiff(lastTimePerKm, avgTimePerKmPast);

    const compareToLabel =
        compareTo === 'earlier'
            ? 'poprzednich treningów'
            : compareTo === 'all'
              ? 'wszystkich treningów'
              : 'innych treningów';

    return (
        <div className='mt-8 space-y-6'>
            <div>
                <h2 className='text-xl font-semibold'>Trening {date(training.date).format('LL')}</h2>
                <p className='text-muted-foreground mt-4'>W porównaniu do {compareToLabel}</p>
                <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                    <StatsCard title='Data' value={date(training.date).format('LL')} infoText='Data treningu' />

                    <StatsCard
                        title='Dystans'
                        value={training.distance_km}
                        unit='km'
                        trend={formatTrend(distanceDiff)}
                        trendIcon={getTrendIcon(distanceDiff, 'distance')}
                        trendMessage={getTrendMessage(distanceDiff, 'distance')}
                        trendProgress={getTrendProgress(distanceDiff, 'distance')}
                        infoText='Większy dystans zwykle oznacza lepszą kondycję i wytrzymałość'
                        formatValue={(val) => val.toFixed(1)}
                    />

                    <StatsCard
                        title='Przewyższenie'
                        value={training.elevation_gain_m}
                        unit='m'
                        trend={formatTrend(elevationDiff)}
                        trendIcon={getTrendIcon(elevationDiff, 'elevation')}
                        trendMessage={getTrendMessage(elevationDiff, 'elevation')}
                        trendProgress={getTrendProgress(elevationDiff, 'elevation')}
                        infoText='Większe przewyższenie to wyższy poziom trudności'
                        formatValue={(val) => val.toFixed(0)}
                    />

                    <StatsCard
                        title='Średnia prędkość'
                        value={training.avg_speed_kmh}
                        unit='km/h'
                        trend={formatTrend(speedDiff)}
                        trendIcon={getTrendIcon(speedDiff, 'speed')}
                        trendMessage={getTrendMessage(speedDiff, 'speed')}
                        trendProgress={getTrendProgress(speedDiff, 'speed')}
                        infoText='Wyższa średnia prędkość wskazuje na poprawę wydolności'
                        formatValue={(val) => val.toFixed(1)}
                    />

                    <StatsCard
                        title='Maksymalna prędkość'
                        value={training.max_speed_kmh}
                        unit='km/h'
                        trend={formatTrend(maxSpeedDiff)}
                        trendIcon={getTrendIcon(maxSpeedDiff, 'maxSpeed')}
                        trendMessage={getTrendMessage(maxSpeedDiff, 'maxSpeed')}
                        trendProgress={getTrendProgress(maxSpeedDiff, 'maxSpeed')}
                        infoText='Wzrost maksymalnej prędkości może świadczyć o lepszej mocy'
                        formatValue={(val) => val.toFixed(1)}
                    />

                    {training.avg_heart_rate_bpm !== null && training.avg_heart_rate_bpm > 0 && (
                        <StatsCard
                            title='Średnie tętno'
                            value={training.avg_heart_rate_bpm}
                            unit='bpm'
                            trend={formatTrend(heartRateDiff)}
                            trendIcon={getTrendIcon(heartRateDiff, 'heartRate')}
                            trendMessage={getTrendMessage(heartRateDiff, 'heartRate')}
                            trendProgress={getTrendProgress(heartRateDiff, 'heartRate')}
                            infoText='Niższe tętno przy podobnym wysiłku oznacza lepszą wydolność sercowo-naczyniową'
                            formatValue={(val) => val.toFixed(0)}
                        />
                    )}

                    <StatsCard
                        title='Czas jazdy'
                        value={lastTotalHours}
                        unit='h'
                        trend={formatTrend(timeDiff)}
                        trendIcon={getTrendIcon(timeDiff, 'time')}
                        trendMessage={getTrendMessage(timeDiff, 'time')}
                        trendProgress={getTrendProgress(timeDiff, 'time')}
                        infoText='Dłuższy czas jazdy buduje podstawową wytrzymałość'
                        formatValue={(val) => val.toFixed(1)}
                    />

                    <StatsCard
                        title='Czas na kilometr'
                        value={lastTimePerKm * 60} // Convert to minutes
                        unit='min/km'
                        trend={formatTrend(timePerKmDiff)}
                        trendIcon={getTrendIcon(timePerKmDiff, 'timePerKm')}
                        trendMessage={getTrendMessage(timePerKmDiff, 'timePerKm')}
                        trendProgress={getTrendProgress(timePerKmDiff, 'timePerKm')}
                        infoText='Niższy czas na kilometr oznacza większą efektywność'
                        formatValue={(val) => val.toFixed(1)}
                    />
                </div>
            </div>
        </div>
    );
}
