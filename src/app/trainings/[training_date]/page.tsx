import { notFound } from 'next/navigation';

import { TrainingOverview } from '@/components/training-overview';
import trainings from '@/data/trainings.json';

interface TrainingPageProps {
    params: {
        training_date: string;
    };
}

export default function TrainingPage({ params }: TrainingPageProps) {
    // Find the training with the given date
    const training = trainings.find((t) => t.date === params.training_date);

    // If no training found, return 404
    if (!training) {
        notFound();
    }

    return (
        <div className='container py-8'>
            <h1 className='mb-6 text-3xl font-bold'>Szczegóły treningu</h1>
            <TrainingOverview training={training} compareTo='other' />
        </div>
    );
}
