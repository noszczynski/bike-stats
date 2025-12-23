"use client";

import { useQuery } from "@tanstack/react-query";
import { Trackpoint, TrackpointsResponse } from "@/types/trackpoint";

async function fetchTrackpoints(trainingId: string): Promise<TrackpointsResponse> {
    const response = await fetch(`/api/trainings/${trainingId}/trackpoints`);

    if (!response.ok) {
        throw new Error("Failed to fetch trackpoints");
    }

    return response.json();
}

export function useTrackpoints(trainingId: string) {
    return useQuery<TrackpointsResponse>({
        queryKey: ["trackpoints", trainingId],
        queryFn: () => fetchTrackpoints(trainingId),
        enabled: !!trainingId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: false, // Don't retry if there are no trackpoints
    });
}
