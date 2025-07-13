'use client';

import { useState } from 'react';

import { PaginationOptions, TrainingFilters, TrainingsResponse } from '@/lib/api/trainings';
import { fetchTrainings } from '@/lib/api/trainings-client';
import { useQuery } from '@tanstack/react-query';

export function useGetTrainings(
    filters: TrainingFilters = {},
    paginationOptions: PaginationOptions = { page: 1, pageSize: 200 }
) {
    const [pagination, setPagination] = useState<PaginationOptions>(paginationOptions);

    // Update pagination state when page or pageSize changes
    const setPage = (newPage: number) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    };

    const setPageSize = (newPageSize: number) => {
        setPagination((prev) => ({ ...prev, pageSize: newPageSize, page: 1 })); // Reset to first page when changing page size
    };

    const query = useQuery<TrainingsResponse>({
        queryKey: ['trainings', filters, pagination],
        queryFn: () => fetchTrainings(filters, pagination),
        // No need for initialData as we're using HydrationBoundary
        staleTime: 1000 * 60 * 5 // 5 minutes
    });

    return {
        ...query,
        pagination,
        setPage,
        setPageSize
    };
}
