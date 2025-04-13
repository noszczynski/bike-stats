import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getActivities, getAthlete } from '@/app/api/_lib/strava';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StravaActivity } from '@/types/strava';

interface StravaProfilePageProps {
    searchParams: {
        error?: string;
    };
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDuration(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
}

function formatDistance(meters: number) {
    return `${(meters / 1000).toFixed(2)} km`;
}

function formatSpeed(metersPerSecond: number) {
    return `${(metersPerSecond * 3.6).toFixed(1)} km/h`;
}

function formatElevation(meters: number) {
    return `${Math.round(meters)}m`;
}

export default async function StravaProfilePage({ searchParams }: StravaProfilePageProps) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('strava_access_token')?.value;
    const refreshToken = cookieStore.get('strava_refresh_token')?.value;

    if (!accessToken) {
        redirect('/auth/strava');
    }

    try {
        const [athlete, activities] = await Promise.all([
            getAthlete(accessToken, refreshToken),
            getActivities(accessToken, refreshToken, { per_page: 100 })
        ]);

        const bikeActivities = (activities as StravaActivity[]).filter((activity) => activity.sport_type === 'Ride');

        console.log(bikeActivities);

        return (
            <main className='flex min-h-screen flex-col items-center p-24'>
                <div className='w-full max-w-4xl space-y-8'>
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
                            <div className='space-y-2'>
                                <h2 className='text-2xl font-semibold'>
                                    {athlete.firstname} {athlete.lastname}
                                </h2>
                                {athlete.username && <p className='text-muted-foreground'>@{athlete.username}</p>}
                                <p className='text-muted-foreground'>
                                    {[athlete.city, athlete.state, athlete.country].filter(Boolean).join(', ')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className='space-y-4'>
                        <h2 className='text-2xl font-semibold'>Latest Bike Activities</h2>
                        <div className='grid gap-4 md:grid-cols-2'>
                            {bikeActivities.map((activity) => (
                                <Card key={activity.id} className='p-4'>
                                    <h3 className='font-semibold'>{activity.name}</h3>
                                    <p className='text-muted-foreground text-sm'>
                                        {formatDate(activity.start_date_local)}
                                    </p>
                                    <div className='mt-2 grid grid-cols-2 gap-2 text-sm'>
                                        <div>
                                            <p className='text-muted-foreground'>Distance</p>
                                            <p className='font-medium'>{formatDistance(activity.distance)}</p>
                                        </div>
                                        <div>
                                            <p className='text-muted-foreground'>Duration</p>
                                            <p className='font-medium'>{formatDuration(activity.moving_time)}</p>
                                        </div>
                                        <div>
                                            <p className='text-muted-foreground'>Avg Speed</p>
                                            <p className='font-medium'>{formatSpeed(activity.average_speed)}</p>
                                        </div>
                                        <div>
                                            <p className='text-muted-foreground'>Elevation</p>
                                            <p className='font-medium'>
                                                {formatElevation(activity.total_elevation_gain)}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        );
    } catch (error) {
        console.error('Error fetching data:', error);
        redirect('/auth/strava?error=failed_to_fetch_athlete');
    }
}
