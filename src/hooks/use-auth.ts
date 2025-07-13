'use client';

import { useQuery } from '@tanstack/react-query';

interface AuthUser {
    id: string;
    email: string;
    hasStravaConnection: boolean;
}

interface AuthStatus {
    isAuthenticated: boolean;
    user?: AuthUser;
}

async function checkAuthStatus(): Promise<AuthStatus> {
    const response = await fetch('/api/auth/status', {
        cache: 'no-store'
    });
    
    if (!response.ok) {
        throw new Error('Failed to check authentication status');
    }
    
    return response.json();
}

export function useAuth() {
    return useQuery({
        queryKey: ['auth-status'],
        queryFn: checkAuthStatus,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 2 * 60 * 1000, // 2 minutes (shorter to catch token expiration faster)
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error) => {
            // Don't retry on auth failures, but retry on network errors
            if (error.message.includes('Failed to check authentication status')) {
                return failureCount < 2;
            }
            
            return false;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
}

// Logout functionality has been moved to use-auth-mutations.ts 