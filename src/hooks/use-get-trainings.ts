'use client';

import { getAllTrainings } from '@/lib/api/trainings';
import type { Training } from '@/types/training';
import { useQuery } from '@tanstack/react-query';

export function useGetTrainings() {
    return useQuery({
        queryKey: ['trainings'],
        queryFn: getAllTrainings,
        // No need for initialData as we're using HydrationBoundary
        staleTime: 1000 * 60 * 5 // 5 minutes
    });
}
