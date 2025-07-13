'use client';

import { useQuery } from '@tanstack/react-query';
import { LogoutButton } from '@/components/LogoutButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

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
    const { data: authData, isLoading: isAuthLoading } = useAuth();
    
    const { data: athlete, isLoading: isAthleteLoading, error } = useQuery({
        queryKey: ['strava-athlete'],
        queryFn: fetchStravaAthlete,
        enabled: authData?.isAuthenticated === true && authData?.user?.hasStravaConnection === true,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
    });

    if (isAuthLoading || isAthleteLoading) {
        return <Skeleton className="h-8 w-32" />;
    }

    if (!authData?.isAuthenticated || !authData?.user) {
        return null;
    }

    // User is authenticated but doesn't have Strava connection
    if (!authData.user.hasStravaConnection) {
        return (
            <div className='flex items-center gap-3'>
                <span className='text-sm font-medium'>
                    {authData.user.email}
                </span>
                <Button
                    size="sm"
                    onClick={() => {
                        window.location.href = '/api/auth/strava';
                    }}
                    className='bg-[#FC4C02] text-white hover:bg-[#FC4C02]/90'>
                    Połącz Strava
                </Button>
                <LogoutButton />
            </div>
        );
    }

    // User has Strava connection but failed to fetch athlete data
    if (error || !athlete) {
        return (
            <div className='flex items-center gap-3'>
                <span className='text-sm font-medium'>
                    {authData.user.email}
                </span>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                        window.location.href = '/api/auth/strava';
                    }}>
                    Ponów połączenie Strava
                </Button>
                <LogoutButton />
            </div>
        );
    }

    // User has Strava connection and athlete data
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