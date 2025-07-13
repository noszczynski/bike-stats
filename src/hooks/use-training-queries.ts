'use client';

import { useQuery } from '@tanstack/react-query';

interface TrackPoint {
    timestamp: number;
    position_lat?: number;
    position_long?: number;
    altitude?: number;
    distance?: number;
    heart_rate?: number;
    speed?: number;
    cadence?: number;
    power?: number;
    temperature?: number;
}

interface TrackPointsResponse {
    trackpoints: TrackPoint[];
    totalCount: number;
}

async function fetchTrackpoints(trainingId: string): Promise<TrackPointsResponse> {
    const response = await fetch(`/api/trainings/${trainingId}/trackpoints`);
    
    if (!response.ok) {
        throw new Error('Failed to fetch trackpoints');
    }
    
    return response.json();
}

export function useTrackpoints(trainingId: string) {
    return useQuery<TrackPointsResponse>({
        queryKey: ['trackpoints', trainingId],
        queryFn: () => fetchTrackpoints(trainingId),
        enabled: !!trainingId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: false // Don't retry if there are no trackpoints
    });
} 