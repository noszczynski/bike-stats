"use client";

import { TrainingCardsContainer } from "@/components/training-cards-container";
import { TrainingFiltersComponent } from "@/components/training-filters";
import { TrainingFilters } from "@/lib/api/trainings";
import { useState } from "react";

export function RidesPageClient() {
    const [filters, setFilters] = useState<TrainingFilters>({});

    const handleFiltersChange = (newFilters: TrainingFilters) => {
        setFilters(newFilters);
    };

    return (
        <div className="space-y-6">
            <TrainingFiltersComponent filters={filters} onFiltersChange={handleFiltersChange} />
            <TrainingCardsContainer filters={filters} />
        </div>
    );
}
