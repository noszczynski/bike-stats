'use client';

import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import date from '@/lib/date';
import type { Training } from '@/types/training';

import { Clipboard, HeartPulseIcon, ZapIcon } from 'lucide-react';

interface TrainingCardsProps {
    trainings: Training[];
}

export function TrainingCards({ trainings }: TrainingCardsProps) {
    return (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {trainings.map((training) => (
                <div key={training.id}>
                    <Link href={`/trainings/${training.id}`}>
                        <Card className='hover:bg-muted/50 h-full transition-all'>
                            <CardHeader className='pb-2'>
                                <CardTitle className='flex items-center justify-between'>
                                    <span>{date(training.date).format('LL')}</span>
                                    <div className='flex items-center gap-2'>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <HeartPulseIcon
                                                        className={`h-5 w-5 ${training.heart_rate_zones ? 'text-green-500' : 'text-red-500'}`}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>
                                                        Strefy tętna:{' '}
                                                        {training.heart_rate_zones ? 'Uzupełnione' : 'Brak'}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Clipboard
                                                        className={`h-5 w-5 ${training.summary ? 'text-green-500' : 'text-red-500'}`}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Podsumowanie: {training.summary ? 'Uzupełnione' : 'Brak'}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <ZapIcon
                                                        className={`h-5 w-5 ${training.effort ? 'text-green-500' : 'text-red-500'}`}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Effort: {training.effort ? 'Uzupełniony' : 'Brak'}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
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
                </div>
            ))}
        </div>
    );
}
