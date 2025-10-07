"use client";

import { useState } from "react";
import { DistanceChart } from "@/components/charts/distance-chart";
import { ElevationChart } from "@/components/charts/elevation-chart";
import { HeartRateChart } from "@/components/charts/heart-rate-chart";
import { HeartRateTimeChart } from "@/components/charts/heart-rate-time-chart";
import { IntensityChart } from "@/components/charts/intensity-chart";
import { PaceChart } from "@/components/charts/pace-chart";
import { YearlyDistanceChart } from "@/components/charts/yearly-distance-chart";
import { useGetTrainings } from "@/hooks/use-get-trainings";
import { TrainingFilters } from "@/lib/api/trainings";
import dayjs from "dayjs";

import { AverageSpeedPerKilometrChart } from "./charts/average-speed-per-kilometr-chart";
import { EfficiencyChart } from "./charts/efficiency-chart";
import { ProgressionTrendsChart } from "./charts/progression-trends-chart";
import { RecoveryChart } from "./charts/recovery-chart";
import { TrainingFrequencyChart } from "./charts/training-frequency-chart";
import { TrainingLoadChart } from "./charts/training-load-chart";
import { VolumeIntensityChart } from "./charts/volume-intensity-chart";
import { TrainingFiltersComponent } from "./training-filters";

export function DashboardMetricsTabContent() {
    const [filters, setFilters] = useState<TrainingFilters>({
        startDate: dayjs().subtract(3, "months").format("YYYY-MM-DD"),
        endDate: dayjs().format("YYYY-MM-DD"),
    });

    const { data: trainingsResponse, error } = useGetTrainings(filters, {
        page: 1,
        pageSize: 1000, // Get all trainings for charts
    });

    const handleFiltersChange = (newFilters: TrainingFilters) => {
        setFilters(newFilters);
    };

    if (error) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <p className="text-red-500">Błąd podczas ładowania danych</p>
                    <p className="text-muted-foreground text-sm">
                        {error instanceof Error ? error.message : "Nieznany błąd"}
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
                <TrainingFiltersComponent filters={filters} onFiltersChange={handleFiltersChange} />
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between">
                <div className="text-muted-foreground text-sm">
                    {trainings.length > 0
                        ? `Znaleziono ${trainings.length} treningów`
                        : "Brak treningów spełniających kryteria"}
                </div>
                {Object.keys(filters).length > 0 && (
                    <div className="text-muted-foreground text-xs">
                        Aktywne filtry: {Object.keys(filters).length}
                    </div>
                )}
            </div>

            {/* Charts */}
            {trainings.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    {/* Training Load & Performance */}
                    <TrainingLoadChart trainings={trainings} />
                    <ProgressionTrendsChart trainings={trainings} />

                    {/* Frequency & Recovery */}
                    <TrainingFrequencyChart trainings={trainings} />
                    <RecoveryChart trainings={trainings} />

                    {/* Volume & Efficiency */}
                    <VolumeIntensityChart trainings={trainings} />
                    <EfficiencyChart trainings={trainings} />

                    {/* Heart Rate Analysis */}
                    <HeartRateChart trainings={trainings} />
                    <HeartRateTimeChart trainings={trainings} />

                    {/* Speed & Pace */}
                    <AverageSpeedPerKilometrChart trainings={trainings} />
                    <PaceChart trainings={trainings} />

                    {/* Distance & Elevation */}
                    <DistanceChart trainings={trainings} />
                    <ElevationChart trainings={trainings} />

                    {/* General Metrics */}
                    <IntensityChart trainings={trainings} />
                    <YearlyDistanceChart trainings={trainings} />
                </div>
            ) : (
                <div className="py-12 text-center">
                    <p className="text-muted-foreground">Brak danych do wyświetlenia w wykresach</p>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Spróbuj zmienić kryteria filtrowania
                    </p>
                </div>
            )}
        </div>
    );
}
