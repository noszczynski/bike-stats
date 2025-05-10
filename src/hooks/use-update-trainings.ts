'use client';

import { updateTrainingsClient } from '@/lib/api/trainings';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateTrainings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ accessToken, refreshToken }: { accessToken: string; refreshToken: string }) => {
            return await updateTrainingsClient(accessToken, refreshToken);
        },
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['trainings'] });
        },
        onError: (error) => {
            console.error(error);
        }
    });
}
