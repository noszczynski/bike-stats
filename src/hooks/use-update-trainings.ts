'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

async function updateTrainingsFromAPI(): Promise<void> {
    const response = await fetch('/api/trainings/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update trainings');
    }

    return response.json();
}

export function useUpdateTrainings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateTrainingsFromAPI,
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['trainings'] });
        },
        onError: (error) => {
            console.error(error);
        }
    });
}
