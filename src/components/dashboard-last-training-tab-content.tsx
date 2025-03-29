import React from 'react';

import { StatsCard } from '@/components/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import trainings from '@/data/trainings.json';
import { Training } from '@/types/training';

import dayjs from 'dayjs';
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

export function DashboardLastTrainingTabContent() {
    // Make sure trainings are sorted by date (newest first)
    const sortedTrainings = [...trainings].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

    // Get the latest training
    const lastTraining = sortedTrainings[0];

    // Get all past trainings excluding the last one
    const pastTrainings = sortedTrainings.slice(1);

    // Perform comparisons only if we have data to compare
    if (!lastTraining || pastTrainings.length === 0) {
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
    const avgDistancePast = pastTrainings.reduce((acc, t) => acc + t.distance_km, 0) / pastTrainings.length;
    const avgElevationPast = pastTrainings.reduce((acc, t) => acc + t.elevation_gain_m, 0) / pastTrainings.length;
    const avgSpeedPast = pastTrainings.reduce((acc, t) => acc + t.avg_speed_kmh, 0) / pastTrainings.length;
    const avgMaxSpeedPast = pastTrainings.reduce((acc, t) => acc + t.max_speed_kmh, 0) / pastTrainings.length;

    // Calculate average heart rate for past trainings (ignoring zeroes)
    const validHeartRateTrainings = pastTrainings.filter((t) => t.avg_heart_rate_bpm > 0);
    const avgHeartRatePast =
        validHeartRateTrainings.length > 0
            ? validHeartRateTrainings.reduce((acc, t) => acc + t.avg_heart_rate_bpm, 0) / validHeartRateTrainings.length
            : 0;

    // Average time calculation
    const avgTimePast =
        pastTrainings.reduce((acc, t) => {
            const [hours, minutes] = t.moving_time.split(':').map(Number);

            return acc + hours + minutes / 60;
        }, 0) / pastTrainings.length;

    // Calculate average time per km
    const avgTimePerKmPast =
        pastTrainings.reduce((acc, t) => {
            const [hours, minutes] = t.moving_time.split(':').map(Number);
            const totalHours = hours + minutes / 60;

            return acc + totalHours / t.distance_km;
        }, 0) / pastTrainings.length;

    // Calculate percentage differences
    const calcPercentageDiff = (current: number, past: number) => {
        if (past === 0) return 0;

        return ((current - past) / past) * 100;
    };

    const distanceDiff = calcPercentageDiff(lastTraining.distance_km, avgDistancePast);
    const elevationDiff = calcPercentageDiff(lastTraining.elevation_gain_m, avgElevationPast);
    const speedDiff = calcPercentageDiff(lastTraining.avg_speed_kmh, avgSpeedPast);
    const maxSpeedDiff = calcPercentageDiff(lastTraining.max_speed_kmh, avgMaxSpeedPast);
    const heartRateDiff =
        lastTraining.avg_heart_rate_bpm > 0 && avgHeartRatePast > 0
            ? calcPercentageDiff(lastTraining.avg_heart_rate_bpm, avgHeartRatePast)
            : 0;

    // Calculate moving time difference
    const [lastHours, lastMinutes] = lastTraining.moving_time.split(':').map(Number);
    const lastTotalHours = lastHours + lastMinutes / 60;
    const timeDiff = calcPercentageDiff(lastTotalHours, avgTimePast);

    // Calculate time per km difference (lower is better, so we negate the difference)
    const lastTimePerKm = lastTotalHours / lastTraining.distance_km;
    const timePerKmDiff = calcPercentageDiff(lastTimePerKm, avgTimePerKmPast) * -1;

    // Helper functions
    const formatTrend = (trend: number) => {
        return `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`;
    };

    const getTrendIcon = (trend: number, positiveIsBetter = true) => {
        if (trend === 0) return undefined;
        const isPositive = trend > 0;
        const isImprovement = (positiveIsBetter && isPositive) || (!positiveIsBetter && !isPositive);

        return isImprovement ? TrendingUpIcon : TrendingDownIcon;
    };

    const getTrendProgress = (trend: number, positiveIsBetter = true): 'progress' | 'regress' | 'neutral' => {
        if (trend === 0) return 'neutral';
        const isPositive = trend > 0;
        const isImprovement = (positiveIsBetter && isPositive) || (!positiveIsBetter && !isPositive);

        return isImprovement ? 'progress' : 'regress';
    };

    const getTrendMessage = (trend: number, positiveIsBetter = true): string => {
        const absValue = Math.abs(trend);
        const isPositive = trend > 0;
        const isImprovement = (positiveIsBetter && isPositive) || (!positiveIsBetter && !isPositive);

        if (absValue === 0) return 'Bez zmian';

        if (absValue < 2) {
            return isImprovement ? 'Niewielka poprawa' : 'Niewielki spadek';
        } else if (absValue < 5) {
            return isImprovement ? 'Umiarkowana poprawa' : 'Umiarkowany spadek';
        } else if (absValue < 10) {
            return isImprovement ? 'Znaczna poprawa' : 'Znaczny spadek';
        } else {
            return isImprovement ? 'Wyraźny postęp' : 'Wyraźny regres';
        }
    };

    return (
        <div className='space-y-6'>
            <div>
                <h2 className='mb-4 text-xl font-semibold'>Ostatni trening: {dayjs(lastTraining.date).format('LL')}</h2>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Dystans (km)</TableHead>
                            <TableHead>Przewyższenie (m)</TableHead>
                            <TableHead>Czas ruchu</TableHead>
                            <TableHead>Średnia prędkość (km/h)</TableHead>
                            <TableHead>Max prędkość (km/h)</TableHead>
                            <TableHead>Średnie tętno (bpm)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>{dayjs(lastTraining.date).format('LL')}</TableCell>
                            <TableCell>{lastTraining.distance_km.toFixed(2)}</TableCell>
                            <TableCell>{lastTraining.elevation_gain_m}</TableCell>
                            <TableCell>{lastTraining.moving_time}</TableCell>
                            <TableCell>{lastTraining.avg_speed_kmh.toFixed(1)}</TableCell>
                            <TableCell>{lastTraining.max_speed_kmh.toFixed(1)}</TableCell>
                            <TableCell>{lastTraining.avg_heart_rate_bpm || '-'}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            <div>
                <h2 className='mb-4 text-xl font-semibold'>Porównanie do poprzednich treningów</h2>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                    <StatsCard
                        title='Dystans'
                        value={lastTraining.distance_km}
                        unit='km'
                        trend={formatTrend(distanceDiff)}
                        trendIcon={getTrendIcon(distanceDiff)}
                        trendMessage={getTrendMessage(distanceDiff)}
                        trendProgress={getTrendProgress(distanceDiff)}
                        infoText='Większy dystans zwykle oznacza lepszą kondycję i wytrzymałość'
                        formatValue={(val) => val.toFixed(1)}
                    />

                    <StatsCard
                        title='Przewyższenie'
                        value={lastTraining.elevation_gain_m}
                        unit='m'
                        trend={formatTrend(elevationDiff)}
                        trendIcon={getTrendIcon(elevationDiff)}
                        trendMessage={getTrendMessage(elevationDiff)}
                        trendProgress={getTrendProgress(elevationDiff)}
                        infoText='Większe przewyższenie to wyższy poziom trudności'
                        formatValue={(val) => val.toFixed(0)}
                    />

                    <StatsCard
                        title='Średnia prędkość'
                        value={lastTraining.avg_speed_kmh}
                        unit='km/h'
                        trend={formatTrend(speedDiff)}
                        trendIcon={getTrendIcon(speedDiff)}
                        trendMessage={getTrendMessage(speedDiff)}
                        trendProgress={getTrendProgress(speedDiff)}
                        infoText='Wyższa średnia prędkość wskazuje na poprawę wydolności'
                        formatValue={(val) => val.toFixed(1)}
                    />

                    <StatsCard
                        title='Maksymalna prędkość'
                        value={lastTraining.max_speed_kmh}
                        unit='km/h'
                        trend={formatTrend(maxSpeedDiff)}
                        trendIcon={getTrendIcon(maxSpeedDiff)}
                        trendMessage={getTrendMessage(maxSpeedDiff)}
                        trendProgress={getTrendProgress(maxSpeedDiff)}
                        infoText='Wzrost maksymalnej prędkości może świadczyć o lepszej mocy'
                        formatValue={(val) => val.toFixed(1)}
                    />

                    {lastTraining.avg_heart_rate_bpm > 0 && (
                        <StatsCard
                            title='Średnie tętno'
                            value={lastTraining.avg_heart_rate_bpm}
                            unit='bpm'
                            trend={formatTrend(heartRateDiff)}
                            trendIcon={getTrendIcon(heartRateDiff, false)} // Lower is better for heart rate in most cases
                            trendMessage={getTrendMessage(heartRateDiff, false)}
                            trendProgress={getTrendProgress(heartRateDiff, false)}
                            infoText='Niższe tętno przy podobnym wysiłku świadczy o poprawie wydolności'
                            formatValue={(val) => val.toFixed(0)}
                        />
                    )}

                    <StatsCard
                        title='Czas jazdy'
                        value={lastTotalHours}
                        unit='h'
                        trend={formatTrend(timeDiff)}
                        trendIcon={getTrendIcon(timeDiff)}
                        trendMessage={getTrendMessage(timeDiff)}
                        trendProgress={getTrendProgress(timeDiff)}
                        infoText='Dłuższy czas jazdy buduje podstawową wytrzymałość'
                        formatValue={(val) => val.toFixed(1)}
                    />

                    <StatsCard
                        title='Czas na kilometr'
                        value={lastTimePerKm * 60} // Convert to minutes
                        unit='min/km'
                        trend={formatTrend(timePerKmDiff)}
                        trendIcon={getTrendIcon(timePerKmDiff, true)} // Lower is better, but we negated the value
                        trendMessage={getTrendMessage(timePerKmDiff, true)}
                        trendProgress={getTrendProgress(timePerKmDiff, true)}
                        infoText='Niższy czas na kilometr oznacza większą efektywność'
                        formatValue={(val) => val.toFixed(1)}
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Podsumowanie porównania</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-muted-foreground'>
                        Powyższe metryki porównują Twój ostatni trening z {pastTrainings.length} poprzednimi treningami.
                        Zielone wskaźniki oznaczają postęp, czerwone - regres w danej metryce.
                    </p>
                    <p className='mt-2'>
                        Pamiętaj, że pojedynczy trening nie zawsze odzwierciedla długoterminowe trendy - różne czynniki
                        jak teren, pogoda czy samopoczucie wpływają na wyniki.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
