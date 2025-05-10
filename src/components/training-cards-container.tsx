'use client';

import { TrainingCards } from '@/components/training-card';
import { useGetTrainings } from '@/hooks/use-get-trainings';

export function TrainingCardsContainer() {
    // The data is now hydrated from the server through HydrationBoundary
    const { data: trainings } = useGetTrainings();

    if (!trainings) {
        return <div>Loading...</div>;
    }

    return <TrainingCards trainings={trainings} />;
}
