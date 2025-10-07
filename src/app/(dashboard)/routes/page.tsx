'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStravaRoutes } from '@/hooks/use-strava-queries';
import { RouteCards } from '@/components/route-card';
import { RouteFilters, RouteFiltersState } from '@/components/route-filters';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import type { StravaRoute } from '@/types/strava';

export default function RoutesPage() {
    const queryClient = useQueryClient();
    const { data: routes = [], isLoading, isFetching } = useStravaRoutes();
    const [filters, setFilters] = useState<RouteFiltersState>({});

    // Filter routes based on filters
    const filteredRoutes = useMemo(() => {
        return routes.filter((route: StravaRoute) => {
            // Distance filter
            if (filters.minDistance !== undefined) {
                const distanceKm = route.distance / 1000;
                if (distanceKm < filters.minDistance) return false;
            }
            if (filters.maxDistance !== undefined) {
                const distanceKm = route.distance / 1000;
                if (distanceKm > filters.maxDistance) return false;
            }

            // Elevation filter
            if (filters.minElevation !== undefined) {
                if (route.elevation_gain < filters.minElevation) return false;
            }
            if (filters.maxElevation !== undefined) {
                if (route.elevation_gain > filters.maxElevation) return false;
            }

            // Privacy filter
            if (filters.private === true && !route.private) return false;
            if (filters.public === true && route.private) return false;

            // Starred filter
            if (filters.starred === true && !route.starred) return false;
            if (filters.notStarred === true && route.starred) return false;

            // Type filter
            if (filters.type !== undefined && route.type !== filters.type) return false;

            // SubType filter
            if (filters.subType !== undefined && route.sub_type !== filters.subType) return false;

            return true;
        });
    }, [routes, filters]);

    const handleRefresh = async () => {
        await queryClient.invalidateQueries({ queryKey: ['strava-routes'] });
    };

    const handleResetFilters = () => {
        setFilters({});
    };

    return (
        <div className='space-y-6'>
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div>
                    <h1 className='text-3xl font-bold'>Moje trasy</h1>
                    <p className='text-muted-foreground'>
                        Znaleziono {filteredRoutes.length} {filteredRoutes.length === 1 ? 'trasę' : 'tras'} z {routes.length}
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

            <RouteFilters
                filters={filters}
                onFiltersChange={setFilters}
                onReset={handleResetFilters}
            />

            {isLoading ? (
                <div className='flex items-center justify-center py-12'>
                    <Loader2 className='h-8 w-8 animate-spin' />
                </div>
            ) : filteredRoutes.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <p className='text-lg text-muted-foreground'>
                        {routes.length === 0 
                            ? 'Nie znaleziono żadnych tras'
                            : 'Brak tras spełniających kryteria filtrowania'}
                    </p>
                    {routes.length > 0 && (
                        <Button
                            onClick={handleResetFilters}
                            variant='outline'
                            className='mt-4'
                        >
                            Resetuj filtry
                        </Button>
                    )}
                </div>
            ) : (
                <RouteCards routes={filteredRoutes} />
            )}
        </div>
    );
}

