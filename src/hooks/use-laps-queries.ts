import { FitStatusResponse, LapsResponse } from "@/types/lap";
import { useQuery } from "@tanstack/react-query";

async function fetchLaps(trainingId: string): Promise<LapsResponse> {
    const response = await fetch(`/api/trainings/${trainingId}/laps`);

    if (!response.ok) {
        throw new Error("Failed to fetch laps");
    }

    return response.json();
}

export function useLaps(trainingId: string) {
    return useQuery({
        queryKey: ["laps", trainingId],
        queryFn: () => fetchLaps(trainingId),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// Hook to check if trackpoints are available
async function fetchFitStatus(trainingId: string): Promise<FitStatusResponse> {
    const response = await fetch(`/api/trainings/${trainingId}/fit-upload`);

    if (!response.ok) {
        throw new Error("Failed to fetch FIT status");
    }

    return response.json();
}

export function useFitStatus(trainingId: string) {
    return useQuery({
        queryKey: ["fit-status", trainingId],
        queryFn: () => fetchFitStatus(trainingId),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
