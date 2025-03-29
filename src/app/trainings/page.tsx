import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trainings } from '@/data/trainings';
import date from '@/lib/date';

export default function TrainingsPage() {
    // Sort trainings by date (newest first)
    const sortedTrainings = [...trainings].sort((a, b) => date(b.date).valueOf() - date(a.date).valueOf());

    return (
        <div className='container py-8'>
            <h1 className='mb-6 text-3xl font-bold'>Wszystkie treningi</h1>

            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {sortedTrainings.map((training) => (
                    <Link href={`/trainings/${training.date}`} key={training.date}>
                        <Card className='hover:bg-muted/50 h-full transition-all'>
                            <CardHeader className='pb-2'>
                                <CardTitle>{date(training.date).format('LL')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className='space-y-2'>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Dystans:</span>
                                        <span className='font-medium'>{training.distance_km.toFixed(1)} km</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Czas jazdy:</span>
                                        <span className='font-medium'>{training.moving_time}</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Średnia prędkość:</span>
                                        <span className='font-medium'>{training.avg_speed_kmh.toFixed(1)} km/h</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
