import React from 'react';

import Link from 'next/link';

import { HeartRateZonesChart } from '@/components/heart-rate-zones-chart';
import { StatsCard } from '@/components/stats-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

import { BatteryUsageChart } from './battery-usage-chart';
import { CompareToSelect } from './compare-to-select';
import { EffortLevelChart } from './effort-level-chart';
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
    allTrainings: Training[];
};

type HeartRateZones = {
    zone_1: string;
    zone_2: string;
    zone_3: string;
    zone_4: string;
    zone_5: string;
};

export function TrainingOverview({ training, compareTo, allTrainings }: TrainingOverviewProps) {
    // Make sure trainings are sorted by date (newest first)
    const sortedTrainings = [...allTrainings].sort(
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
        <div className='space-y-8'>
            <div className='border-b pb-4'>
                <div className='flex flex-col gap-4'>
                    <div className='flex items-center justify-between'>
                        <h1 className='text-2xl font-bold'>Szczegóły treningu</h1>
                        <div className='flex items-center gap-2'>
                            {prevTraining ? (
                                <Link
                                    href={`/trainings/${prevTraining.id}?compareTo=${compareTo}`}
                                    className='ring-offset-background focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'>
                                    <ChevronLeft className='h-4 w-4' />
                                </Link>
                            ) : (
                                <button
                                    disabled
                                    className='ring-offset-background focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'>
                                    <ChevronLeft className='h-4 w-4' />
                                </button>
                            )}
                            {nextTraining ? (
                                <Link
                                    href={`/trainings/${nextTraining.id}?compareTo=${compareTo}`}
                                    className='ring-offset-background focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'>
                                    <ChevronRight className='h-4 w-4' />
                                </Link>
                            ) : (
                                <button
                                    disabled
                                    className='ring-offset-background focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'>
                                    <ChevronRight className='h-4 w-4' />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
                        <h2 className='text-muted-foreground text-lg font-medium'>
                            {training.name} - {date(training.date).format('LL')}
                        </h2>
                        <div className='mt-2 sm:mt-0'>
                            <CompareToSelect trainingDate={training.date} />
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue='overview' className='w-full'>
                <TabsList>
                    <TabsTrigger value='overview'>Przegląd</TabsTrigger>
                    <TabsTrigger value='performance'>Wydajność</TabsTrigger>
                    <TabsTrigger value='physical'>Parametry fizyczne</TabsTrigger>
                    <TabsTrigger value='technical'>Dane techniczne</TabsTrigger>
                    <TabsTrigger value='summary'>Podsumowanie</TabsTrigger>
                    <TabsTrigger value='edit'>Edycja</TabsTrigger>
                </TabsList>

                <TabsContent value='overview' className='mt-6'>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
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
                    </div>
                </TabsContent>

                <TabsContent value='performance' className='mt-6'>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
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
                            value={lastTimePerKm * 60}
                            unit='min/km'
                            trend={formatTrend(timePerKmDiff)}
                            trendIcon={getTrendIcon(timePerKmDiff, 'timePerKm')}
                            trendMessage={getTrendMessage(timePerKmDiff, 'timePerKm')}
                            trendProgress={getTrendProgress(timePerKmDiff, 'timePerKm')}
                            infoText={`Niższy czas na kilometr oznacza większą efektywność. Twój średni czas na kilometr wynosi: ${(avgTimePerKmPast * 60).toFixed(1)} min/km`}
                            formatValue={(val) => val.toFixed(1)}
                        />
                    </div>
                </TabsContent>

                <TabsContent value='physical' className='mt-6'>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                        {!isNil(training.avg_heart_rate_bpm) && training.avg_heart_rate_bpm > 0 && (
                            <StatsCard
                                title='Średnie tętno'
                                value={training.avg_heart_rate_bpm || 0}
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
                        {training.heart_rate_zones && (
                            <HeartRateZonesChart heartRateZones={training.heart_rate_zones as HeartRateZones} />
                        )}
                    </div>
                </TabsContent>

                <TabsContent value='technical' className='mt-6'>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                        <BatteryUsageChart
                            device={training.device ?? null}
                            batteryUsage={training.battery_percent_usage ?? null}
                        />
                        <EffortLevelChart effort={training.effort ?? 0} />
                    </div>
                </TabsContent>

                <TabsContent value='summary' className='mt-6'>
                    <div className='space-y-4'>
                        <p className='text-muted-foreground whitespace-pre-wrap'>{training.summary}</p>
                    </div>
                </TabsContent>

                <TabsContent value='edit' className='mt-6'>
                    <div className='max-w-2xl space-y-6'>
                        <div className='space-y-4'>
                            <h3 className='text-lg font-medium'>Edytuj szczegóły treningu</h3>
                            <div className='grid gap-4'>
                                <div className='space-y-2'>
                                    <label htmlFor='summary' className='text-sm font-medium'>
                                        Podsumowanie
                                    </label>
                                    <textarea
                                        id='summary'
                                        className='border-input min-h-[100px] w-full rounded-md border bg-transparent px-3 py-2'
                                        defaultValue={training.summary ?? ''}
                                        placeholder='Dodaj podsumowanie treningu...'
                                    />
                                </div>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div className='space-y-2'>
                                        <label htmlFor='device' className='text-sm font-medium'>
                                            Urządzenie
                                        </label>
                                        <input
                                            type='text'
                                            id='device'
                                            className='border-input w-full rounded-md border bg-transparent px-3 py-2'
                                            defaultValue={training.device ?? ''}
                                            placeholder='Nazwa urządzenia...'
                                        />
                                    </div>
                                    <div className='space-y-2'>
                                        <label htmlFor='effort' className='text-sm font-medium'>
                                            Poziom wysiłku (0-100)
                                        </label>
                                        <input
                                            type='number'
                                            id='effort'
                                            min='0'
                                            max='100'
                                            className='border-input w-full rounded-md border bg-transparent px-3 py-2'
                                            defaultValue={training.effort ?? ''}
                                        />
                                    </div>
                                </div>
                                <button className='bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'>
                                    Zapisz zmiany
                                </button>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
