'use client';

import React, { useState } from 'react';
import { DistanceChart } from '@/components/charts/distance-chart';
import { ElevationChart } from '@/components/charts/elevation-chart';
import { HeartRateChart } from '@/components/charts/heart-rate-chart';
import { HeartRateTimeChart } from '@/components/charts/heart-rate-time-chart';
import { IntensityChart } from '@/components/charts/intensity-chart';
import { PaceChart } from '@/components/charts/pace-chart';
import { YearlyDistanceChart } from '@/components/charts/yearly-distance-chart';
import { AverageSpeedPerKilometrChart } from './charts/average-speed-per-kilometr-chart';
import { TrainingFiltersComponent } from './training-filters';
import { TrainingFilters } from '@/lib/api/trainings';
import { useGetTrainings } from '@/hooks/use-get-trainings';

export function DashboardMetricsTabContent() {
    const [filters, setFilters] = useState<TrainingFilters>({});
    
    const { data: trainingsResponse, isLoading, error } = useGetTrainings(filters, { 
        page: 1, 
        pageSize: 1000 // Get all trainings for charts
    });

    const handleFiltersChange = (newFilters: TrainingFilters) => {
        setFilters(newFilters);
    };

    const handleFiltersReset = () => {
        setFilters({});
    };

    if (error) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <p className="text-red-500">Błąd podczas ładowania danych</p>
                    <p className="text-muted-foreground text-sm">
                        {error instanceof Error ? error.message : 'Nieznany błąd'}
                    </p>
                </div>
            </div>
        );
    }

    const trainings = trainingsResponse?.trainings || [];

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="w-full">
                <TrainingFiltersComponent
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onReset={handleFiltersReset}
                />
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {trainings.length > 0 ? (
                        `Znaleziono ${trainings.length} treningów`
                    ) : (
                        'Brak treningów spełniających kryteria'
                    )}
                </div>
                {Object.keys(filters).length > 0 && (
                    <div className="text-xs text-muted-foreground">
                        Aktywne filtry: {Object.keys(filters).length}
                    </div>
                )}
            </div>

            {/* Charts */}
            {trainings.length > 0 ? (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-2'>
                    <HeartRateChart trainings={trainings} />
                    <HeartRateTimeChart trainings={trainings} />
                    <AverageSpeedPerKilometrChart trainings={trainings} />
                    <PaceChart trainings={trainings} />
                    <DistanceChart trainings={trainings} />
                    <ElevationChart trainings={trainings} />
                    <IntensityChart trainings={trainings} />
                    <YearlyDistanceChart trainings={trainings} />
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        Brak danych do wyświetlenia w wykresach
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Spróbuj zmienić kryteria filtrowania
                    </p>
                </div>
            )}
        </div>
    );
}
