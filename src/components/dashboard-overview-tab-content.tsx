import { StatsCard } from '@/components/stats-card';
import { calculateAverageHeartRate } from '@/features/training/calculate-average-heart-rate';
import { calculateAverageSpeed } from '@/features/training/calculate-average-speed';
import { calculateHighestAverageSpeed } from '@/features/training/calculate-highest-average-speed';
import { calculateMaxSpeed } from '@/features/training/calculate-max-speed';
import { getAllTrainings } from '@/lib/api/trainings';
import date from '@/lib/date';

import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

export async function DashboardOverviewTabContent() {
    const { trainings } = await getAllTrainings();

    const avgSpeed = calculateAverageSpeed(trainings);
    const maxSpeed = calculateMaxSpeed(trainings);
    const avgHeartRate = calculateAverageHeartRate(trainings);
    const highestAvgSpeed = calculateHighestAverageSpeed(trainings);

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

    if (!trainings || trainings.length === 0) {
        return <div>No trainings found</div>;
    }

    // Get trainings from the last 30 days and previous 30 days
    const now = date();
    const thirtyDaysAgo = now.subtract(30, 'day');
    const sixtyDaysAgo = now.subtract(60, 'day');

    const recentTrainings = trainings.filter((training) => date(training.date).isAfter(thirtyDaysAgo));
    const previousTrainings = trainings.filter((training) => {
        const trainingDate = date(training.date);
        
        return trainingDate.isAfter(sixtyDaysAgo) && trainingDate.isBefore(thirtyDaysAgo);
    });

    // Calculate trends
    const calculateTrend = (recent: number, previous: number) => {
        if (previous === 0) return 0;
        
        return ((recent - previous) / previous) * 100;
    };

    const recentAvgSpeed = recentTrainings.length > 0 
        ? recentTrainings.reduce((acc, t) => acc + t.avg_speed_kmh, 0) / recentTrainings.length 
        : 0;
    const previousAvgSpeed = previousTrainings.length > 0 
        ? previousTrainings.reduce((acc, t) => acc + t.avg_speed_kmh, 0) / previousTrainings.length 
        : 0;
    const speedTrend = calculateTrend(recentAvgSpeed, previousAvgSpeed);

    return (
        <div className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
                <StatsCard
                    title='Średnia prędkość'
                    value={avgSpeed.toFixed(1)}
                    unit='km/h'
                    description='Średnia prędkość ze wszystkich treningów'
                />
                <StatsCard
                    title='Maksymalna prędkość'
                    value={maxSpeed.toFixed(1)}
                    unit='km/h'
                    description='Najwyższa prędkość osiągnięta w treningach'
                />
                <StatsCard
                    title='Średnie tętno'
                    value={avgHeartRate.toFixed(0)}
                    unit='bpm'
                    description='Średnie tętno ze wszystkich treningów'
                />
                <StatsCard
                    title='Liczba treningów'
                    value={trainings.length.toString()}
                    unit='treningi'
                    description='Całkowita liczba treningów'
                />
                <StatsCard
                    title='Najwyższa średnia prędkość'
                    value={highestAvgSpeed.toFixed(1)}
                    unit='km/h'
                    description='Najwyższa średnia prędkość w pojedynczym treningu'
                />
                <StatsCard
                    title='Średnia prędkość (ostatnie 30 dni)'
                    value={recentAvgSpeed.toFixed(1)}
                    unit='km/h'
                    description='Średnia prędkość z ostatnich 30 dni'
                    trend={formatTrend(speedTrend)}
                    trendIcon={getTrendIcon(speedTrend)}
                    trendProgress={getTrendProgress(speedTrend)}
                />
                <StatsCard
                    title='Treningi (ostatnie 30 dni)'
                    value={recentTrainings.length.toString()}
                    unit='treningi'
                    description='Liczba treningów w ostatnich 30 dniach'
                />
            </div>
        </div>
    );
}
