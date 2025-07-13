import { useQuery } from '@tanstack/react-query';

type HeartRateZonesSuggestion = {
    zones: {
        zone_1: string;
        zone_2: string;
        zone_3: string;
        zone_4: string;
        zone_5: string;
    };
    trackpointsCount: number;
};

export function useHeartRateZonesSuggestion(trainingId: string) {
    return useQuery<HeartRateZonesSuggestion>({
        queryKey: ['heart-rate-zones-suggestion', trainingId],
        queryFn: async () => {
            const response = await fetch(`/api/trainings/${trainingId}/heart-rate-zones-suggestion`);
            if (!response.ok) {
                throw new Error('Failed to fetch heart rate zones suggestion');
            }
            
return response.json();
        },
        enabled: !!trainingId,
        retry: false // Don't retry if there are no trackpoints
    });
} 