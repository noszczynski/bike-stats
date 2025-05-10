import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { TrainingCardsContainer } from '@/components/training-cards-container';
import { UpdateTrainingsButton } from '@/components/update-trainings-button';
import { getAllTrainings } from '@/lib/api/trainings';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

export default async function TrainingsPage() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('strava_access_token')?.value;
    const refreshToken = cookieStore.get('strava_refresh_token')?.value;

    if (!accessToken || !refreshToken) {
        redirect('/auth/strava');
    }

    // Create a new QueryClient for the server
    const queryClient = new QueryClient();

    // Prefetch data on the server and put it in the query cache
    await queryClient.prefetchQuery({
        queryKey: ['trainings'],
        queryFn: getAllTrainings
    });

    // Dehydrate the query cache to send it to the client
    const dehydratedState = dehydrate(queryClient);

    return (
        <div className='container py-8'>
            <div className='flex flex-row gap-2'>
                <h1 className='mb-6 text-3xl font-bold'>Wszystkie treningi</h1>
                <UpdateTrainingsButton accessToken={accessToken} refreshToken={refreshToken} />
            </div>
            <HydrationBoundary state={dehydratedState}>
                <TrainingCardsContainer />
            </HydrationBoundary>
        </div>
    );
}
