import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getAthlete } from '@/app/api/_lib/strava';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface StravaProfilePageProps {
    searchParams: {
        error?: string;
    };
}

export default async function StravaProfilePage({ searchParams }: StravaProfilePageProps) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('strava_access_token')?.value;

    if (!accessToken) {
        redirect('/auth/strava');
    }

    try {
        const athlete = await getAthlete(accessToken);

        return (
            <main className='flex min-h-screen flex-col items-center justify-center p-24'>
                <div className='w-full max-w-xl space-y-8'>
                    {searchParams.error === 'failed_to_fetch_athlete' && (
                        <Alert variant='destructive'>
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                Failed to fetch athlete data. Please try again later or reconnect your Strava account.
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className='flex items-center justify-between'>
                        <h1 className='text-3xl font-bold'>Strava Profile</h1>
                        <Link href='/'>
                            <Button variant='outline'>Back to Home</Button>
                        </Link>
                    </div>

                    <div className='bg-card rounded-lg p-6 shadow-lg'>
                        <div className='flex items-center space-x-4'>
                            <img
                                src={athlete.profile}
                                alt={`${athlete.firstname} ${athlete.lastname}`}
                                className='h-20 w-20 rounded-full'
                            />
                            <div>
                                <h2 className='text-2xl font-semibold'>
                                    {athlete.firstname} {athlete.lastname}
                                </h2>
                                <p className='text-muted-foreground'>
                                    {athlete.city}, {athlete.state}, {athlete.country}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    } catch (error) {
        console.error('Error fetching athlete data:', error);
        redirect('/auth/strava?error=failed_to_fetch_athlete');
    }
}
