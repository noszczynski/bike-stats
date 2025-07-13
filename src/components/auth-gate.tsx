'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeSwitch } from '@/components/ui/theme-switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

interface AuthGateProps {
    children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
    const { data, isLoading, error } = useAuth();

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className='flex min-h-screen flex-col items-center justify-center p-24'>
                <div className='w-full max-w-md space-y-8'>
                    <div className='text-center'>
                        <Skeleton className="h-8 w-48 mx-auto mb-4" />
                        <Skeleton className="h-4 w-64 mx-auto" />
                    </div>
                    <div className='flex justify-center'>
                        <Skeleton className="h-12 w-48" />
                    </div>
                </div>
            </div>
        );
    }

    // Show login screen if not authenticated or if there's an error
    if (error || !data?.isAuthenticated) {
        return (
            <div className='flex min-h-screen flex-col'>
                {/* Header with theme switch */}
                <div className='flex w-full items-center justify-end gap-4 border-b px-8 py-4'>
                    <ThemeSwitch />
                </div>
                
                {/* Login content */}
                <div className='flex flex-1 flex-col items-center justify-center p-24'>
                    <div className='w-full max-w-md space-y-8'>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertDescription>
                                    Failed to verify authentication. Please try logging in again.
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        <div className='text-center'>
                            <h1 className='text-4xl font-bold mb-2'>Bike Stats</h1>
                            <h2 className='text-2xl font-semibold mb-4'>Zaloguj się</h2>
                            <p className='text-muted-foreground'>
                                Musisz się zalogować, aby uzyskać dostęp do swoich statystyk treningowych i dashboardu.
                            </p>
                        </div>

                        <div className='flex flex-col gap-4 justify-center'>
                            <Button asChild>
                                <Link href="/login">
                                    Zaloguj się
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/register">
                                    Zarejestruj się
                                </Link>
                            </Button>
                        </div>
                        
                        <div className='text-center text-sm text-muted-foreground'>
                            <p>
                                Po zalogowaniu będziesz mógł połączyć swoje konto Strava i wyświetlić swoje metryki treningowe, 
                                historię treningów i szczegółowe analizy.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // User is authenticated, show the dashboard
    return <>{children}</>;
} 