import { StatsCard } from '@/components/stats-card';
import { trainings } from '@/data/trainings';
import { calculateHighestAverageSpeed } from '@/features/training/calculate-highest-average-speed';
import date from '@/lib/date';

import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

export function DashboardGlobalStatsTabContent() {
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
                            const trainingDate = date(training.date);

                            return trainingDate.isAfter(date('2025-01-01')) ? acc + training.distance_km : acc;
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

                    <StatsCard
                        title='Średni dystans treningu'
                        value={
                            trainings.length > 0
                                ? trainings.reduce((acc, training) => acc + training.distance_km, 0) / trainings.length
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
                        value={Math.max(...trainings.map((training) => training.avg_heart_rate_bpm).filter(Boolean))}
                        unit='bpm'
                        infoText='Najwyższe średnie tętno na treningu'
                        formatValue={(val) => val.toFixed(0)}
                    />
                </div>
            </section>
        </div>
    );
}
