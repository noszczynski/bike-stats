import React from 'react';

import Link from 'next/link';

import { HeartRateZonesChart } from '@/components/heart-rate-zones-chart';
import { StatsCard } from '@/components/stats-card';
import { trainings } from '@/data/trainings';
import { calculateTrainingLoad } from '@/features/training/calculate-training-load';
import {
    MetricType,
    formatTrend,
    getTrendIcon,
    getTrendMessage,
    getTrendProgress
} from '@/features/training/trend-utils';
import date from '@/lib/date';
import { Training } from '@/types/training';

import { CompareToSelect } from './compare-to-select';
import isNil from 'lodash/isNil';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Helper function to convert time string (hh:mm:ss) to minutes
function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);

    return hours * 60 + minutes;
}

// Helper function to format minutes back to time string
function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = (minutes % 60).toFixed(0);

    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

type TrainingOverviewProps = {
    training: Training;
    compareTo: 'all' | 'earlier' | 'other';
};

export function TrainingOverview({ training, compareTo }: TrainingOverviewProps) {
    // Make sure trainings are sorted by date (newest first)
    const sortedTrainings = [...trainings].sort(
        (a, b) => date(b.date).valueOf() - date(a.date).valueOf()
    ) as Training[];

    // Find current training index
    const currentIndex = sortedTrainings.findIndex((t) => t.date === training.date);
    const prevTraining = currentIndex < sortedTrainings.length - 1 ? sortedTrainings[currentIndex + 1] : null;
    const nextTraining = currentIndex > 0 ? sortedTrainings[currentIndex - 1] : null;

    // Get all trainings to compare against
    let compareTrainings: Training[] = [];

    if (compareTo === 'all') {
        // Compare to all trainings
        compareTrainings = sortedTrainings;
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
        .filter((t) => t.avg_heart_rate_bpm! > 0);

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
        !isNil(training.avg_heart_rate_bpm) && training.avg_heart_rate_bpm > 0 && avgHeartRatePast > 0
            ? calcPercentageDiff(training.avg_heart_rate_bpm, avgHeartRatePast)
            : 0;

    // Calculate moving time difference
    const [lastHours, lastMinutes] = training.moving_time.split(':').map(Number);
    const lastTotalHours = lastHours + lastMinutes / 60;
    const timeDiff = calcPercentageDiff(lastTotalHours, avgTimePast);

    // Calculate time per km difference (lower is better, so we negate the difference)
    const lastTimePerKm = lastTotalHours / training.distance_km;
    const timePerKmDiff = calcPercentageDiff(lastTimePerKm, avgTimePerKmPast);

    // Calculate max values for training load
    const maxValues = {
        maxDistance: Math.max(...compareTrainings.map((t) => t.distance_km)),
        maxSpeed: Math.max(...compareTrainings.map((t) => t.avg_speed_kmh)),
        maxHR: Math.max(...compareTrainings.map((t) => t.avg_heart_rate_bpm ?? 0)),
        maxElevation: Math.max(...compareTrainings.map((t) => t.elevation_gain_m))
    };

    // Calculate current training load
    const currentTrainingLoad = calculateTrainingLoad(training, maxValues);

    // Calculate average training load for comparison
    const avgTrainingLoad =
        compareTrainings.reduce((acc, t) => {
            const load = calculateTrainingLoad(t, maxValues);

            return acc + load.intensity;
        }, 0) / compareTrainings.length;

    // Calculate percentage difference for training load
    const trainingLoadDiff = calcPercentageDiff(currentTrainingLoad.intensity, avgTrainingLoad);

    const compareToLabel =
        compareTo === 'earlier'
            ? 'poprzednich treningów'
            : compareTo === 'all'
              ? 'wszystkich treningów'
              : 'innych treningów';

    return (
        <div className='space-y-6'>
            <div>
                <div className='flex items-center justify-between gap-2'>
                    <div className='flex items-center gap-2'>
                        {prevTraining ? (
                            <Link
                                href={`/trainings/${prevTraining.date}?compareTo=${compareTo}`}
                                className='ring-offset-background focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'>
                                <ChevronLeft className='h-4 w-4' />
                            </Link>
                        ) : (
                            <button
                                disabled
                                className='ring-offset-background focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'>
                                <ChevronLeft className='h-4 w-4' />
                            </button>
                        )}
                        {nextTraining ? (
                            <Link
                                href={`/trainings/${nextTraining.date}?compareTo=${compareTo}`}
                                className='ring-offset-background focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'>
                                <ChevronRight className='h-4 w-4' />
                            </Link>
                        ) : (
                            <button
                                disabled
                                className='ring-offset-background focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'>
                                <ChevronRight className='h-4 w-4' />
                            </button>
                        )}
                    </div>
                    <CompareToSelect trainingDate={training.date} />
                </div>
            </div>
            <div>
                <div className='flex items-center justify-between'>
                    <h2 className='text-xl font-semibold'>Trening {date(training.date).format('LL')}</h2>
                </div>
                <p className='text-muted-foreground mt-4'>W porównaniu do {compareToLabel}</p>
                <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                    <StatsCard title='Data' value={date(training.date).format('LL')} infoText='Data treningu' />

                    <StatsCard
                        title='Obciążenie treningowe'
                        value={currentTrainingLoad.intensity}
                        unit=''
                        trend={formatTrend(trainingLoadDiff)}
                        trendIcon={getTrendIcon(trainingLoadDiff, 'intensity')}
                        trendMessage={getTrendMessage(trainingLoadDiff, 'intensity')}
                        trendProgress={getTrendProgress(trainingLoadDiff, 'intensity')}
                        infoText={`Wskaźnik obciążenia treningowego (0-100) uwzględnia dystans, prędkość, tętno i przewyższenie. Twoje średnie obciążenie wynosi: ${avgTrainingLoad.toFixed(0)}`}
                        formatValue={(val) => val.toFixed(0)}
                    />

                    <StatsCard
                        title='Dystans'
                        value={training.distance_km}
                        unit='km'
                        trend={formatTrend(distanceDiff)}
                        trendIcon={getTrendIcon(distanceDiff, 'distance')}
                        trendMessage={getTrendMessage(distanceDiff, 'distance')}
                        trendProgress={getTrendProgress(distanceDiff, 'distance')}
                        infoText={`Więcej = lepiej. Większy dystans zwykle oznacza lepszą kondycję i wytrzymałość. Twój średni dystans wynosi: ${avgDistancePast.toFixed(1)} km`}
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
                        infoText={`Większe przewyższenie to wyższy poziom trudności. Twoje średnie przewyższenie wynosi: ${avgElevationPast.toFixed(0)} m`}
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
                        infoText={`Wyższa średnia prędkość wskazuje na poprawę wydolności. Twoja średnia prędkość wynosi: ${avgSpeedPast.toFixed(1)} km/h`}
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
                        infoText={`Wzrost maksymalnej prędkości może świadczyć o lepszej mocy. Twoja średnia maksymalna prędkość wynosi: ${avgMaxSpeedPast.toFixed(1)} km/h`}
                        formatValue={(val) => val.toFixed(1)}
                    />

                    {!isNil(training.avg_heart_rate_bpm) && training.avg_heart_rate_bpm > 0 && (
                        <StatsCard
                            title='Średnie tętno'
                            value={training.avg_heart_rate_bpm}
                            unit='bpm'
                            trend={formatTrend(heartRateDiff)}
                            trendIcon={getTrendIcon(heartRateDiff, 'heartRate')}
                            trendMessage={getTrendMessage(heartRateDiff, 'heartRate')}
                            trendProgress={getTrendProgress(heartRateDiff, 'heartRate')}
                            infoText={`Niższe tętno przy podobnym wysiłku oznacza lepszą wydolność sercowo-naczyniową. Twoje średnie tętno wynosi: ${avgHeartRatePast.toFixed(0)} bpm`}
                            formatValue={(val) => val.toFixed(0)}
                        />
                    )}

                    <StatsCard
                        title='Czas jazdy'
                        value={`${lastHours > 0 ? `${lastHours} h ` : ''}${lastHours > 0 ? lastMinutes.toString().padStart(2, '0') : lastMinutes.toString()} min`}
                        unit=''
                        trend={formatTrend(timeDiff)}
                        trendIcon={getTrendIcon(timeDiff, 'time')}
                        trendMessage={getTrendMessage(timeDiff, 'time')}
                        trendProgress={getTrendProgress(timeDiff, 'time')}
                        infoText={`Dłuższy czas jazdy buduje podstawową wytrzymałość. Twój średni czas jazdy wynosi: ${formatMinutes(avgTimePast * 60)}`}
                    />

                    <StatsCard
                        title='Czas na kilometr'
                        value={lastTimePerKm * 60} // Convert to minutes
                        unit='min/km'
                        trend={formatTrend(timePerKmDiff)}
                        trendIcon={getTrendIcon(timePerKmDiff, 'timePerKm')}
                        trendMessage={getTrendMessage(timePerKmDiff, 'timePerKm')}
                        trendProgress={getTrendProgress(timePerKmDiff, 'timePerKm')}
                        infoText={`Niższy czas na kilometr oznacza większą efektywność. Twój średni czas na kilometr wynosi: ${(avgTimePerKmPast * 60).toFixed(1)} min/km`}
                        formatValue={(val) => val.toFixed(1)}
                    />

                    {training.heart_rate_zones && <HeartRateZonesChart heartRateZones={training.heart_rate_zones} />}
                </div>
            </div>

            <div className='space-y-4'>
                <h2 className='text-xl font-semibold'>Podsumowanie</h2>
                <p className='text-muted-foreground whitespace-pre-wrap'>{training.summary}</p>
            </div>
        </div>
    );
}
