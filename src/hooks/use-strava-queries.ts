'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StravaAthlete, StravaActivity, StravaRoute } from '@/types/strava';

async function fetchStravaAthlete(): Promise<StravaAthlete> {
    const response = await fetch('/api/auth/strava/athlete');
    
    if (!response.ok) {
        throw new Error('Failed to fetch Strava athlete data');
    }
    
    return response.json();
}

async function fetchStravaActivities(perPage: number = 100): Promise<StravaActivity[]> {
    const response = await fetch(`/api/auth/strava/activities?per_page=${perPage}`);
    
    if (!response.ok) {
        throw new Error('Failed to fetch Strava activities');
    }
    
    return response.json();
}

async function refreshStravaTokens(): Promise<void> {
    const response = await fetch('/api/auth/strava/refresh-tokens', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to refresh Strava tokens');
    }
}

async function fetchStravaRoutes(perPage: number = 100): Promise<StravaRoute[]> {
    const response = await fetch(`/api/strava/routes?per_page=${perPage}`);
    
    if (!response.ok) {
        throw new Error('Failed to fetch Strava routes');
    }
    
    return response.json();
}

export function useStravaAthlete() {
    return useQuery<StravaAthlete>({
        queryKey: ['strava-athlete'],
        queryFn: fetchStravaAthlete,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount, error) => {
            // Don't retry on auth failures
            if (error.message.includes('Failed to fetch Strava athlete data')) {
                return failureCount < 2;
            }
            return false;
        }
    });
}

export function useStravaActivities(perPage: number = 100) {
    return useQuery<StravaActivity[]>({
        queryKey: ['strava-activities', perPage],
        queryFn: () => fetchStravaActivities(perPage),
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error) => {
            // Don't retry on auth failures
            if (error.message.includes('Failed to fetch Strava activities')) {
                return failureCount < 2;
            }
            return false;
        }
    });
}

export function useStravaRoutes(perPage: number = 100) {
    return useQuery<StravaRoute[]>({
        queryKey: ['strava-routes', perPage],
        queryFn: () => fetchStravaRoutes(perPage),
        staleTime: 60 * 60 * 1000, // 1 hour
        gcTime: 2 * 60 * 60 * 1000, // 2 hours
        retry: (failureCount, error) => {
            if (error.message.includes('Failed to fetch Strava routes')) {
                return failureCount < 2;
            }
            return false;
        }
    });
}

export function useRefreshStravaTokens() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: refreshStravaTokens,
        onSuccess: () => {
            // Invalidate Strava-related queries to trigger refetch with new tokens
            queryClient.invalidateQueries({ queryKey: ['strava-athlete'] });
            queryClient.invalidateQueries({ queryKey: ['strava-activities'] });
            queryClient.invalidateQueries({ queryKey: ['strava-auth-status'] });
            queryClient.invalidateQueries({ queryKey: ['strava-routes'] });
        }
    });
} 