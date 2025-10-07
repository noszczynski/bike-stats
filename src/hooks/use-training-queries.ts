"use client";

import { useQuery } from "@tanstack/react-query";

interface TrackPoint {
    timestamp: string; // iso string
    position_lat?: number | null;
    position_long?: number | null;
    altitude?: number | null;
    distance?: number | null;
    heart_rate_bpm?: number | null;
    speed?: number | null;
    cadence?: number | null;
    power?: number | null;
    temperature?: number | null;
}

interface TrackPointsResponse {
    trackpoints: TrackPoint[];
    totalCount: number;
}

async function fetchTrackpoints(trainingId: string): Promise<TrackPointsResponse> {
    const response = await fetch(`/api/trainings/${trainingId}/trackpoints`);

    if (!response.ok) {
        throw new Error("Failed to fetch trackpoints");
    }

    return response.json();
}

export function useTrackpoints(trainingId: string) {
    return useQuery<TrackPointsResponse>({
        queryKey: ["trackpoints", trainingId],
        queryFn: () => fetchTrackpoints(trainingId),
        enabled: !!trainingId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: false, // Don't retry if there are no trackpoints
    });
}
