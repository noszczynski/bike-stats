import { StatsCard } from '@/components/stats-card';
import { TrainingHistoryTable } from '@/components/training-history-table';
import trainings from '@/data/trainings.json';
import { calculateAverageHeartRate } from '@/features/training/calculate-average-heart-rate';
import { calculateAverageSpeed } from '@/features/training/calculate-average-speed';
import { calculateHighestAverageSpeed } from '@/features/training/calculate-highest-average-speed';
import { calculateMaxSpeed } from '@/features/training/calculate-max-speed';

import dayjs from 'dayjs';
import { TrendingUpIcon } from 'lucide-react';

export const DashboardOverviewTabContent = () => {
    const avgSpeed = calculateAverageSpeed(trainings);
    const maxSpeed = calculateMaxSpeed(trainings);
    const avgHeartRate = calculateAverageHeartRate(trainings);
    const highestAvgSpeed = calculateHighestAverageSpeed(trainings);

    return (
        <div className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
                <StatsCard
                    title='Średnia prędkość'
                    value={avgSpeed}
                    unit='km/h'
                    trend='+2.1%'
                    trendIcon={TrendingUpIcon}
                    trendMessage='Stabilny przyrost'
                    infoText={`Na podstawie ${trainings.length} treningów`}
                />

                <StatsCard
                    title='Maksymalna prędkość'
                    value={maxSpeed}
                    unit='km/h'
                    trend='+5.2%'
                    trendIcon={TrendingUpIcon}
                    trendMessage='Stabilny przyrost'
                    infoText={`Na podstawie ${trainings.length} treningów`}
                />

                <StatsCard
                    title='Średni Heart Rate na trening'
                    value={avgHeartRate}
                    unit='bpm'
                    trend='+3.8%'
                    trendIcon={TrendingUpIcon}
                    trendMessage='Stabilny przyrost'
                    infoText={`Na podstawie ${trainings.length} treningów`}
                    formatValue={(val) => val.toFixed(0)}
                />

                <StatsCard
                    title='Najwyższa średnia prędkość'
                    value={highestAvgSpeed}
                    unit='km/h'
                    trend='+1.5%'
                    trendIcon={TrendingUpIcon}
                    trendMessage='Stabilny przyrost'
                    infoText={`Na podstawie ${trainings.length} treningów`}
                />

                <StatsCard
                    title='Łączny dystans'
                    value={trainings.reduce((acc, training) => acc + training.distance_km, 0)}
                    unit='km'
                    trend='+12.3%'
                    trendIcon={TrendingUpIcon}
                    trendMessage='Wzrost dystansu'
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
                    trend='+12.3%'
                    trendIcon={TrendingUpIcon}
                    trendMessage='Wzrost dystansu'
                    infoText={`Na podstawie ${trainings.length} treningów`}
                    formatValue={(val) => val.toFixed(0)}
                />

                <StatsCard
                    title='Średnie przewyższenie na trening'
                    value={trainings.reduce((acc, training) => acc + training.elevation_gain_m, 0) / trainings.length}
                    unit='m'
                    trend='+8.7%'
                    trendIcon={TrendingUpIcon}
                    trendMessage='Wzrost przewyższeń'
                    infoText={`Na podstawie ${trainings.length} treningów`}
                    formatValue={(val) => val.toFixed(0)}
                />

                <StatsCard
                    title='Łączne przewyższenie'
                    value={trainings.reduce((acc, training) => acc + training.elevation_gain_m, 0)}
                    unit='m'
                    trend='+15.2%'
                    trendIcon={TrendingUpIcon}
                    trendMessage='Wzrost przewyższeń'
                    infoText={`Na podstawie ${trainings.length} treningów`}
                    formatValue={(val) => val.toFixed(0)}
                />

                <StatsCard
                    title='Średni czas jazdy na trening'
                    value={
                        trainings.reduce((acc, training) => {
                            const [hours, minutes] = training.moving_time.split(':').map(Number);

                            return acc + hours + minutes / 60;
                        }, 0) / trainings.length
                    }
                    unit='h'
                    trend='+5.4%'
                    trendIcon={TrendingUpIcon}
                    trendMessage='Wzrost czasu jazdy'
                    infoText={`Na podstawie ${trainings.length} treningów`}
                    formatValue={(val) => val.toFixed(1)}
                />

                <StatsCard
                    title='Liczba treningów'
                    value={trainings.length}
                    unit=''
                    trend='+18.2%'
                    trendIcon={TrendingUpIcon}
                    trendMessage='Wzrost częstotliwości'
                    infoText='Wszystkie zarejestrowane treningi'
                    formatValue={(val) => val.toFixed(0)}
                />

                <StatsCard
                    title='Najwyższy dystans'
                    value={Math.max(...trainings.map((training) => training.distance_km))}
                    unit='km'
                    trend='+5.2%'
                    trendIcon={TrendingUpIcon}
                    trendMessage='Nowy rekord'
                    infoText='Najdłuższy pojedynczy trening'
                    formatValue={(val) => val.toFixed(1)}
                />

                <StatsCard
                    title='Najwyższy średni HR'
                    value={Math.max(...trainings.map((training) => training.avg_heart_rate_bpm))}
                    unit='bpm'
                    trend='+3.1%'
                    trendIcon={TrendingUpIcon}
                    trendMessage='Nowy rekord'
                    infoText='Najwyższe średnie tętno na treningu'
                    formatValue={(val) => val.toFixed(0)}
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
                    trend='-2.3%'
                    trendIcon={TrendingUpIcon}
                    trendMessage='Nowy rekord'
                    infoText='Najszybszy średni czas na kilometr'
                    formatValue={(val) => (val * 60).toFixed(1)}
                />

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
                    trend='-1.8%'
                    trendIcon={TrendingUpIcon}
                    trendMessage='Poprawa tempa'
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
