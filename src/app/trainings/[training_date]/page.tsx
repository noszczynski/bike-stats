import { notFound } from 'next/navigation';

import { TrainingOverview } from '@/components/training-overview';
import { trainings } from '@/data/trainings';

type CompareToType = 'all' | 'earlier' | 'other';

interface TrainingPageProps {
    params: {
        training_date: string;
    };
    searchParams: {
        compareTo?: string;
    };
}

export default function TrainingPage({ params, searchParams }: TrainingPageProps) {
    // Find the training with the given date
    const training = trainings.find((t) => t.date === params.training_date);

    // If no training found, return 404
    if (!training) {
        notFound();
    }

    // Get compareTo from searchParams or default to 'other'
    // Ensure it's one of the valid values
    const validCompareToValues: CompareToType[] = ['all', 'earlier', 'other'];

    const compareTo = validCompareToValues.includes(searchParams.compareTo as CompareToType)
        ? (searchParams.compareTo as CompareToType)
        : 'other';

    if (!validCompareToValues.includes(compareTo)) {
        return null;
    }

    return (
        <div className='container py-8'>
            <h1 className='mb-6 text-3xl font-bold'>Szczegóły treningu</h1>
            <TrainingOverview training={training} compareTo={compareTo} />
        </div>
    );
}
