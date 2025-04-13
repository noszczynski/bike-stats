import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { TrainingOverview } from '@/components/training-overview';
import { getAllTrainings, getTrainingById } from '@/lib/api/trainings';

type CompareToType = 'all' | 'earlier' | 'other';

interface TrainingPageProps {
    params: {
        training_id: string;
    };
    searchParams: {
        compareTo?: string;
    };
}

export default async function TrainingPage({ params, searchParams }: TrainingPageProps) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('strava_access_token')?.value;
    const refreshToken = cookieStore.get('strava_refresh_token')?.value;

    if (!accessToken || !refreshToken) {
        return <div>No access token or refresh token found</div>;
    }

    const allTrainings = await getAllTrainings(accessToken, refreshToken);

    // Find the training with the given ID
    const training = await getTrainingById(params.training_id, accessToken, refreshToken);

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
            <TrainingOverview training={training} compareTo={compareTo} allTrainings={allTrainings} />
        </div>
    );
}
