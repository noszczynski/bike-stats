'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useStravaAuth } from '@/hooks/use-strava-auth';
import { StravaLoginButton } from '@/components/StravaLoginButton';
import { Skeleton } from '@/components/ui/skeleton';

interface StravaAuthWrapperProps {
    children: ReactNode;
    fallback?: ReactNode;
    showLoginButton?: boolean;
    redirectToAuth?: boolean;
}

export function StravaAuthWrapper({ 
    children, 
    fallback, 
    showLoginButton = true, 
    redirectToAuth = false 
}: StravaAuthWrapperProps) {
    const { data, isLoading, error } = useStravaAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (redirectToAuth && !isLoading && !data?.isAuthenticated) {
            router.push('/auth/strava');
        }
    }, [redirectToAuth, isLoading, data?.isAuthenticated, router]);

    // Invalidate athlete query when authentication status changes
    useEffect(() => {
        if (data?.isAuthenticated === false) {
            queryClient.invalidateQueries({ queryKey: ['strava-athlete'] });
        }
    }, [data?.isAuthenticated, queryClient]);

    if (isLoading) {
        return fallback || <Skeleton className="h-8 w-32" />;
    }

    if (error) {
        console.error('Failed to check Strava authentication:', error);
        
return showLoginButton ? <StravaLoginButton /> : null;
    }

    if (!data?.isAuthenticated) {
        return showLoginButton ? <StravaLoginButton /> : null;
    }

    return <>{children}</>;
} 