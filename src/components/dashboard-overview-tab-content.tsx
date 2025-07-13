import { StatsCard } from '@/components/stats-card';
import { TrainingHistoryTable } from '@/components/training-history-table';
import { calculateAverageHeartRate } from '@/features/training/calculate-average-heart-rate';
import { calculateAverageSpeed } from '@/features/training/calculate-average-speed';
import { calculateMaxSpeed } from '@/features/training/calculate-max-speed';
import { getAllTrainings } from '@/lib/api/trainings';

export async function DashboardOverviewTabContent() {
    const { trainings } = await getAllTrainings();

    const avgSpeed = calculateAverageSpeed(trainings);
    const maxSpeed = calculateMaxSpeed(trainings);
    const avgHeartRate = calculateAverageHeartRate(trainings);

    if (!trainings || trainings.length === 0) {
        return <div>No trainings found</div>;
    }

    return (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
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
            <div className='col-span-full'>
                <TrainingHistoryTable />
            </div>
        </div>
    );
}
