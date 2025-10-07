'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStravaRoutes } from '@/hooks/use-strava-queries';
import { RouteCards } from '@/components/route-card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';

export default function RoutesPage() {
    const queryClient = useQueryClient();
    const { data: routes = [], isLoading, isFetching } = useStravaRoutes();

    const handleRefresh = async () => {
        await queryClient.invalidateQueries({ queryKey: ['strava-routes'] });
    };

    return (
        <div className='space-y-6'>
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div>
                    <h1 className='text-3xl font-bold'>Moje trasy publiczne</h1>
                    <p className='text-muted-foreground'>
                        Znaleziono {routes.length} tras
                    </p>
                </div>
                <Button
                    onClick={handleRefresh}
                    disabled={isFetching}
                    variant='outline'
                >
                    {isFetching ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                        <RefreshCw className='h-4 w-4' />
                    )}
                    Odśwież
                </Button>
            </div>

            {isLoading ? (
                <div className='flex items-center justify-center py-12'>
                    <Loader2 className='h-8 w-8 animate-spin' />
                </div>
            ) : routes.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <p className='text-lg text-muted-foreground'>
                        {routes.length === 0 
                            ? 'Nie znaleziono żadnych tras'
                            : 'Brak tras spełniających kryteria filtrowania'}
                    </p>
                </div>
            ) : (
                <RouteCards routes={routes} />
            )}
        </div>
    );
}

