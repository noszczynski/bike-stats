import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllTrainings, updateTrainings } from '@/lib/api/trainings';
import date from '@/lib/date';

export default async function TrainingsPage() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('strava_access_token')?.value;
    const refreshToken = cookieStore.get('strava_refresh_token')?.value;

    if (!accessToken || !refreshToken) {
        redirect('/auth/strava');
    }

    const trainings = await getAllTrainings();

    const update = async () => {
        'use server';
        const result = await updateTrainings(accessToken, refreshToken);
        console.log(result);
    };

    return (
        <div className='container py-8'>
            <div className='flex flex-row gap-2'>
                <h1 className='mb-6 text-3xl font-bold'>Wszystkie treningi</h1>
                <Button variant='link' onClick={update}>
                    Aktualizuj
                </Button>
            </div>
            <TrainingCards trainings={trainings} />
        </div>
    );
}

const TrainingCards = ({ trainings }: { trainings: Awaited<ReturnType<typeof getAllTrainings>> }) => (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {trainings.map((training) => {
            return (
                <div key={training.id}>
                    <Link href={`/trainings/${training.id}`}>
                        <Card className='hover:bg-muted/50 h-full transition-all'>
                            <CardHeader className='pb-2'>
                                <CardTitle className='flex items-center justify-between'>
                                    <span>{date(training.date).format('LL')}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className='space-y-2'>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Dystans:</span>
                                        <span className='font-medium'>{training.distance_km.toFixed(2)} km</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Czas jazdy:</span>
                                        <span className='font-medium'>
                                            {training.moving_time}
                                        </span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Średnia prędkość:</span>
                                        <span className='font-medium'>
                                            {(training.avg_speed_kmh).toFixed(1)} km/h
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            );
        })}
    </div>
);
