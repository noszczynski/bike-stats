import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GenerateLapsResponse } from '@/types/lap';

interface GenerateLapsData {
    trainingId: string;
    distance_km: number;
}

async function generateLaps({ trainingId, distance_km }: GenerateLapsData): Promise<GenerateLapsResponse> {
    const response = await fetch(`/api/trainings/${trainingId}/laps/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            distance_km
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate laps');
    }

    return response.json();
}

export function useGenerateLaps() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: generateLaps,
        onSuccess: (data, variables) => {
            toast.success(`Wygenerowano ${data.laps?.length || 0} odcinków po ${data.lap_distance_km}km`);
            
            // Invalidate laps query to refetch the data
            queryClient.invalidateQueries({
                queryKey: ['laps', variables.trainingId]
            });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Nie udało się wygenerować odcinków');
        }
    });
} 