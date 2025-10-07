import { useQuery } from '@tanstack/react-query';

type NavigationData = {
    current: {
        id: string;
        name: string;
        date: string;
    };
    previous: {
        id: string;
        name: string;
        date: string;
    } | null;
    next: {
        id: string;
        name: string;
        date: string;
    } | null;
};

export function useTrainingNavigation(trainingId: string) {
    return useQuery<NavigationData>({
        queryKey: ['training-navigation', trainingId],
        queryFn: async () => {
            const response = await fetch(`/api/trainings/${trainingId}/navigation`);
            if (!response.ok) {
                throw new Error('Failed to fetch navigation data');
            }
            
return response.json();
        },
        enabled: !!trainingId
    });
} 