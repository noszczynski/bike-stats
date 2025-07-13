'use client';

import { TrainingCards } from '@/components/training-card';
import { useGetTrainings } from '@/hooks/use-get-trainings';

export function TrainingCardsContainer() {
    // The data is now hydrated from the server through HydrationBoundary
    const { data } = useGetTrainings();

    if (!data?.trainings) {
        return <div>Loading...</div>;
    }

    console.log(data.trainings);

    return <TrainingCards trainings={data.trainings} />;
}
