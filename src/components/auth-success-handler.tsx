'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

export function AuthSuccessHandler() {
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    useEffect(() => {
        const authSuccess = searchParams.get('auth');
        
        if (authSuccess === 'success') {
            // Immediately invalidate authentication queries to refresh the UI
            queryClient.invalidateQueries({ queryKey: ['strava-auth-status'] });
            queryClient.invalidateQueries({ queryKey: ['strava-athlete'] });
            
            // Also invalidate any training-related queries that might depend on auth
            queryClient.invalidateQueries({ queryKey: ['trainings'] });
            
            // Remove the auth parameter from the URL without triggering a navigation
            const url = new URL(window.location.href);
            url.searchParams.delete('auth');
            window.history.replaceState({}, '', url.toString());
        }
    }, [searchParams, queryClient]);

    return null;
} 