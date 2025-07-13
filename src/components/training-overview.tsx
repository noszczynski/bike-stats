'use client';

import React, { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { HeartRateZonesChart } from '@/components/heart-rate-zones-chart';
import { RideMap } from '@/components/ride-map';
import { StatsCard } from '@/components/stats-card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { calculateTrainingLoad } from '@/features/training/calculate-training-load';
import {
    formatTrend,
    getTrendIcon,
    getTrendMessage,
    getTrendProgress
} from '@/features/training/trend-utils';
import date from '@/lib/date';
import { Training } from '@/types/training';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateTraining } from '@/hooks/use-training-mutations';

import { CompareToSelect } from './compare-to-select';
import { EffortLevelChart } from './effort-level-chart';
import { FitUpload } from './fit-upload';
import { FitHeartRateChart } from './charts/fit-heart-rate-chart';
import isNil from 'lodash/isNil';
import { ChevronLeft, ChevronRight, Loader2, SparklesIcon, Clock, Activity } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { z } from 'zod';
import { useTrainingNavigation } from '@/hooks/use-training-navigation';
import { useHeartRateZonesSuggestion } from '@/hooks/use-heart-rate-zones-suggestion';
import { cn } from '../lib/utils';

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

const editFormSchema = z.object({
    heart_rate_zones: z.object({
        zone_1_h: z.string().optional(),
        zone_1_m: z.string().optional(),
        zone_1_s: z.string().optional(),
        zone_2_h: z.string().optional(),
        zone_2_m: z.string().optional(),
        zone_2_s: z.string().optional(),
        zone_3_h: z.string().optional(),
        zone_3_m: z.string().optional(),
        zone_3_s: z.string().optional(),
        zone_4_h: z.string().optional(),
        zone_4_m: z.string().optional(),
        zone_4_s: z.string().optional(),
        zone_5_h: z.string().optional(),
        zone_5_m: z.string().optional(),
        zone_5_s: z.string().optional()
    }),
    summary: z.string().optional(),
    device: z.string().optional(),
    battery_percent_usage: z.string().optional(),
    effort: z.string().optional()
});

type EditFormData = z.infer<typeof editFormSchema>;

// Helper function to combine hours, minutes, seconds into a time string
function combineTimeComponents(hours: string, minutes: string, seconds: string): string | undefined {
    // Even if all fields are empty, still format them as "00:00:00" rather than returning undefined
    const h = !hours || hours === '0' ? '00' : hours.padStart(2, '0');
    const m = !minutes || minutes === '0' ? '00' : minutes.padStart(2, '0');
    const s = !seconds || seconds === '0' ? '00' : seconds.padStart(2, '0');

    return `${h}:${m}:${s}`;
}

export function TrainingOverview({ training, compareTo, allTrainings }: TrainingOverviewProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const updateTrainingMutation = useUpdateTraining();
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useQueryState('tab', { defaultValue: 'overview' });

    // Use React Query hooks for server-side data
    const { data: navigationData } = useTrainingNavigation(training.id);

    const { register, handleSubmit } = useForm<EditFormData>({
        resolver: zodResolver(editFormSchema),
        defaultValues: {
            heart_rate_zones: {
                zone_1_h: training.heart_rate_zones?.zone_1 ? training.heart_rate_zones.zone_1.split(':')[0] : '',
                zone_1_m: training.heart_rate_zones?.zone_1 ? training.heart_rate_zones.zone_1.split(':')[1] : '',
                zone_1_s: training.heart_rate_zones?.zone_1 ? training.heart_rate_zones.zone_1.split(':')[2] : '',
                zone_2_h: training.heart_rate_zones?.zone_2 ? training.heart_rate_zones.zone_2.split(':')[0] : '',
                zone_2_m: training.heart_rate_zones?.zone_2 ? training.heart_rate_zones.zone_2.split(':')[1] : '',
                zone_2_s: training.heart_rate_zones?.zone_2 ? training.heart_rate_zones.zone_2.split(':')[2] : '',
                zone_3_h: training.heart_rate_zones?.zone_3 ? training.heart_rate_zones.zone_3.split(':')[0] : '',
                zone_3_m: training.heart_rate_zones?.zone_3 ? training.heart_rate_zones.zone_3.split(':')[1] : '',
                zone_3_s: training.heart_rate_zones?.zone_3 ? training.heart_rate_zones.zone_3.split(':')[2] : '',
                zone_4_h: training.heart_rate_zones?.zone_4 ? training.heart_rate_zones.zone_4.split(':')[0] : '',
                zone_4_m: training.heart_rate_zones?.zone_4 ? training.heart_rate_zones.zone_4.split(':')[1] : '',
                zone_4_s: training.heart_rate_zones?.zone_4 ? training.heart_rate_zones.zone_4.split(':')[2] : '',
                zone_5_h: training.heart_rate_zones?.zone_5 ? training.heart_rate_zones.zone_5.split(':')[0] : '',
                zone_5_m: training.heart_rate_zones?.zone_5 ? training.heart_rate_zones.zone_5.split(':')[1] : '',
                zone_5_s: training.heart_rate_zones?.zone_5 ? training.heart_rate_zones.zone_5.split(':')[2] : ''
            },
            device: training.device ?? '',
            battery_percent_usage: training.battery_percent_usage?.toString() ?? '',
            effort: training.effort?.toString() ?? ''
        }
    });

    const onSubmit = async (data: EditFormData) => {
        setIsSubmitting(true);
        try {
            const updateData = {
                heart_rate_zones: {
                    zone_1: combineTimeComponents(
                        data.heart_rate_zones.zone_1_h || '',
                        data.heart_rate_zones.zone_1_m || '',
                        data.heart_rate_zones.zone_1_s || ''
                    ),
                    zone_2: combineTimeComponents(
                        data.heart_rate_zones.zone_2_h || '',
                        data.heart_rate_zones.zone_2_m || '',
                        data.heart_rate_zones.zone_2_s || ''
                    ),
                    zone_3: combineTimeComponents(
                        data.heart_rate_zones.zone_3_h || '',
                        data.heart_rate_zones.zone_3_m || '',
                        data.heart_rate_zones.zone_3_s || ''
                    ),
                    zone_4: combineTimeComponents(
                        data.heart_rate_zones.zone_4_h || '',
                        data.heart_rate_zones.zone_4_m || '',
                        data.heart_rate_zones.zone_4_s || ''
                    ),
                    zone_5: combineTimeComponents(
                        data.heart_rate_zones.zone_5_h || '',
                        data.heart_rate_zones.zone_5_m || '',
                        data.heart_rate_zones.zone_5_s || ''
                    )
                },
                device: data.device || undefined,
                battery_percent_usage: data.battery_percent_usage
                    ? parseInt(data.battery_percent_usage)
                    : undefined,
                effort: data.effort ? parseInt(data.effort) : undefined
            };

            await updateTrainingMutation.mutateAsync({ 
                trainingId: training.id, 
                data: updateData 
            });

            router.refresh();
        } catch (error) {
            console.error('Error updating training:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Navigation data from server
    const prevTraining = navigationData?.previous;
    const nextTraining = navigationData?.next;

    // Get all trainings to compare against
    let compareTrainings: Training[] = [];
    
    // Sort trainings by date (newest first)
    const sortedTrainings = [...allTrainings].sort(
        (a, b) => date(b.date).valueOf() - date(a.date).valueOf()
    );

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

    return (
        <div className='space-y-8'>
            <div className='border-b pb-4'>
                <div className='flex flex-col gap-4'>
                    <div className='flex items-center justify-between'>
                        <h1 className='text-2xl font-bold'>Szczegóły treningu</h1>
                        <div className='flex items-center gap-2'>
                            {prevTraining ? (
                                <Link
                                    href={`/trainings/${prevTraining.id}?compareTo=${compareTo}&tab=${activeTab}`}
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
                                    href={`/trainings/${nextTraining.id}?compareTo=${compareTo}&tab=${activeTab}`}
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
                <TabsList>
                    <TabsTrigger value='overview'>Przegląd</TabsTrigger>
                    <TabsTrigger value='performance'>Wydajność</TabsTrigger>
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
                    <div className='flex flex-row gap-4'>
                        {/* Ride Map */}
                        {typeof window !== 'undefined' && training && training.map && training.map.summary_polyline && (
                            <RideMap summaryPolyline={training.map.summary_polyline} />
                        )}
                        {/* Strava Embed */}
                        {/* {typeof window !== 'undefined' && training.strava_activity_id && (
                            <StravaEmbed stravaActivityId={training.strava_activity_id} />
                        )} */}
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
                        
                        <EffortLevelChart effort={training.effort ?? 0} />

                        {training.heart_rate_zones && (
                            <div className='col-span-2'>
                                    <HeartRateZonesChart heartRateZones={training.heart_rate_zones as HeartRateZones} />
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value='technical' className='mt-6'>
                    <div className='space-y-6 w-full'>
                        <div className='flex flex-row items-stretch gap-4 w-full'>
                            <FitUpload 
                                trainingId={training.id} 
                                onUploadSuccess={() => router.refresh()} 
                            />
                        </div>
                        <div className='mt-6 w-full'>
                            <FitHeartRateChart trainingId={training.id} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value='summary' className='mt-6'>
                    <div className='space-y-4 max-w-[800px]'>
                        {training.summary ? (
                            <div className='max-w-none'>
                                <ReactMarkdown
                                    components={{
                                        h2: ({ children }) => <h2 className='mb-4 text-2xl font-bold'>{children}</h2>,
                                        h3: ({ children }) => (
                                            <h3 className='mt-6 mb-3 text-xl font-semibold'>{children}</h3>
                                        ),
                                        p: ({ children }) => <p className='mb-4 leading-relaxed'>{children}</p>,
                                        ul: ({ children }) => <ul className='mb-4 space-y-1 pl-6'>{children}</ul>,
                                        li: ({ children }) => <li className='ml-2 list-disc'>{children}</li>,
                                        strong: ({ children }) => <strong className='font-semibold'>{children}</strong>,
                                        em: ({ children }) => <em className='italic'>{children}</em>
                                    }}>
                                    {training.summary}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <p className='text-muted-foreground'>Brak podsumowania treningu.</p>
                        )}

                        <div className='mt-4 flex justify-end'>
                            <Button
                                onClick={async () => {
                                    setIsGenerating(true);
                                    try {
                                        const response = await fetch(
                                            `/api/trainings/${training.id}/description/generate`,
                                            {
                                                method: 'POST'
                                            }
                                        );

                                        if (!response.ok) {
                                            throw new Error('Nie udało się wygenerować podsumowania');
                                        }

                                        const data = await response.json();

                                        toast('Podsumowanie wygenerowane pomyślnie', {
                                            description: 'Podsumowanie treningu zostało zaktualizowane.'
                                        });

                                        router.refresh();
                                    } catch (error) {
                                        toast('Nie udało się wygenerować podsumowania', {
                                            description:
                                                error instanceof Error
                                                    ? error.message
                                                    : 'Proszę spróbować ponownie później'
                                        });
                                    } finally {
                                        setIsGenerating(false);
                                    }
                                }}
                                disabled={isGenerating}
                                className='gap-2'>
                                {isGenerating ? (
                                    <>
                                        <Loader2 className='h-4 w-4 animate-spin' />
                                        Generowanie...
                                    </>
                                ) : training.summary ? (
                                    <>
                                        <SparklesIcon size={16} />
                                        Wygeneruj ponownie
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon size={16} />
                                        Generuj podsumowanie
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value='edit' className='mt-6'>
                    <div className='max-w-3xl space-y-8'>
                        <div className='space-y-6'>
                            <h3 className='text-xl font-medium'>Edytuj szczegóły treningu</h3>

                            <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
                                {/* Heart Rate Zones Section */}
                                <div className='rounded-lg border p-4'>
                                    <h4 className='mb-2 text-lg font-medium'>Strefy tętna</h4>

                                    <div className='grid gap-2'>
                                        <div className='mb-1 grid grid-cols-12 gap-1'>
                                            <div className='col-span-2'></div>
                                            <div className='text-muted-foreground col-span-3 text-center text-xs'>
                                                Godz
                                            </div>
                                            <div className='text-muted-foreground col-span-3 text-center text-xs'>
                                                Min
                                            </div>
                                            <div className='text-muted-foreground col-span-3 text-center text-xs'>
                                                Sek
                                            </div>
                                        </div>
                                        {(['1', '2', '3', '4', '5'] as const).map((zoneNumber) => {
                                            // Parse existing time value into hours, minutes, seconds
                                            const timeValue =
                                                training.heart_rate_zones?.[
                                                    `zone_${zoneNumber}` as keyof typeof training.heart_rate_zones
                                                ] ?? '';

                                            let hours = '',
                                                minutes = '',
                                                seconds = '';
                                            if (timeValue) {
                                                const parts = timeValue.split(':');
                                                hours = parts[0] || '';
                                                minutes = parts[1] || '';
                                                seconds = parts[2] || '';
                                            }

                                            return (
                                                <div
                                                    key={`zone_${zoneNumber}`}
                                                    className='grid grid-cols-10 items-center gap-1'>
                                                    <Label
                                                        htmlFor={`zone_${zoneNumber}_h`}
                                                        className='col-span-2 text-sm font-medium'>
                                                        Strefa {zoneNumber}
                                                    </Label>
                                                    <div className='col-span-2'>
                                                        <input
                                                            type='number'
                                                            id={`zone_${zoneNumber}_h`}
                                                            className='border-input w-full rounded-md border bg-transparent px-2 py-1 text-center text-sm'
                                                            defaultValue={hours}
                                                            placeholder='00'
                                                            min='0'
                                                            max='23'
                                                            {...register(`heart_rate_zones.zone_${zoneNumber}_h`)}
                                                        />
                                                    </div>
                                                    <div className='col-span-1 text-center'>:</div>
                                                    <div className='col-span-2'>
                                                        <input
                                                            type='number'
                                                            id={`zone_${zoneNumber}_m`}
                                                            className='border-input w-full rounded-md border bg-transparent px-2 py-1 text-center text-sm'
                                                            defaultValue={minutes}
                                                            placeholder='00'
                                                            min='0'
                                                            max='59'
                                                            {...register(`heart_rate_zones.zone_${zoneNumber}_m`)}
                                                        />
                                                    </div>
                                                    <div className='col-span-1 text-center'>:</div>
                                                    <div className='col-span-2'>
                                                        <input
                                                            type='number'
                                                            id={`zone_${zoneNumber}_s`}
                                                            className='border-input w-full rounded-md border bg-transparent px-2 py-1 text-center text-sm'
                                                            defaultValue={seconds}
                                                            placeholder='00'
                                                            min='0'
                                                            max='59'  
                                                            {...register(`heart_rate_zones.zone_${zoneNumber}_s`)}
                                                        />
                                                    </div>
                                                                                </div> 
                            ); 
                        })}

<div className='flex justify-end pt-2'>
                                    <Button type='submit' className='px-8' variant='default' disabled={isSubmitting}>
                                        {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
                                    </Button>
                                </div>
                    </div>
                </div>
                            </form>

                <div className='rounded-lg border p-4'>
                                    <h4 className='mb-2 text-lg font-medium'>Wysiłek</h4>

                                    <div className='space-y-3 pt-2'>
                                        
                                        <RadioGroup
                                            {...register('effort')}
                                            defaultValue={String(training.effort ?? 1)}
                                            className='grid grid-cols-5 gap-3 md:grid-cols-10'
                                            onValueChange={async (value) => {
                                                const effortValue = parseInt(value);
                                                try {
                                                    await updateTrainingMutation.mutateAsync({
                                                        trainingId: training.id,
                                                        data: { effort: effortValue }
                                                    });
                                                    router.refresh();
                                                    toast.success('Poziom wysiłku został zaktualizowany');
                                                } catch (error) {
                                                    console.error('Error updating effort:', error);
                                                    toast.error('Nie udało się zaktualizować poziomu wysiłku');
                                                }
                                            }}
                                        >
                                            {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
                                                <div key={value} className='flex items-center justify-center'>
                                                    <RadioGroupItem
                                                        value={String(value)}
                                                        id={`effort-${value}`}
                                                        className='peer sr-only'
                                                    />
                                                    <Label
                                                        htmlFor={`effort-${value}`}
                                                        className={cn('flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 text-sm font-medium transition-all hover:bg-accent peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary', {
                                                            'bg-primary text-primary-foreground border-primary hover:bg-primary/80': value === (training.effort ?? 1),
                                                        })}
                                                    >
                                                        {value}
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                        
                                        <div className='flex items-center justify-between'>
                                            <div className='text-muted-foreground flex w-full justify-between px-1 text-xs'>
                                                <span>Łatwy</span>
                                                <span>Umiarkowany</span>
                                                <span>Trudny</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StravaEmbed({ stravaActivityId }: { stravaActivityId: number }) {
    React.useEffect(() => {
        // Declare StravaEmbeds on window to avoid TypeScript error

        const win = window as typeof window & { StravaEmbeds?: any };
        // Only add the script if it hasn't been added yet
        if (!document.getElementById('strava-embed-script')) {
            const script = document.createElement('script');
            script.id = 'strava-embed-script';
            script.src = 'https://strava-embeds.com/embed.js';
            script.async = true;
            document.body.appendChild(script);
        } else if (win.StravaEmbeds) {
            // If script is already loaded, re-parse embeds
            win.StravaEmbeds.process();
        }
    }, [stravaActivityId]);

    return (
        <div className='mt-6 flex w-full justify-center'>
            <div
                className='strava-embed-placeholder w-full max-w-2xl'
                data-embed-type='activity'
                data-embed-id={stravaActivityId}
                data-style='standard'
            />
        </div>
    );
}
