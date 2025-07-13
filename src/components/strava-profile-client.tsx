'use client';

import { useQuery } from '@tanstack/react-query';
import { LogoutButton } from '@/components/LogoutButton';
import { Skeleton } from '@/components/ui/skeleton';
import { useStravaAuth } from '@/hooks/use-strava-auth';

interface StravaAthlete {
    id: number;
    username: string | null;
    firstname: string;
    lastname: string;
    profile: string;
    profile_medium: string;
}

async function fetchStravaAthlete(): Promise<StravaAthlete> {
    const response = await fetch('/api/auth/strava/athlete');
    
    if (!response.ok) {
        throw new Error('Failed to fetch athlete data');
    }
    
    return response.json();
}

export function StravaProfileClient() {
    const { data: authData, isLoading: isAuthLoading } = useStravaAuth();
    
    const { data: athlete, isLoading: isAthleteLoading, error } = useQuery({
        queryKey: ['strava-athlete'],
        queryFn: fetchStravaAthlete,
        enabled: authData?.isAuthenticated === true,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
    });

    if (isAuthLoading || isAthleteLoading) {
        return <Skeleton className="h-8 w-32" />;
    }

    if (!authData?.isAuthenticated || error || !athlete) {
        return null;
    }

    return (
        <div className='flex items-center gap-3'>
            <img
                src={athlete.profile}
                alt={`${athlete.firstname} ${athlete.lastname}`}
                className='h-8 w-8 rounded-full'
            />
            <span className='text-sm font-medium'>
                {athlete.firstname} {athlete.lastname}
            </span>
            <LogoutButton />
        </div>
    );
} 