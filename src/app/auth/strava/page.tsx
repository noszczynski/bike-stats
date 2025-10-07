"use client";

import { useEffect } from "react";
import { StravaLoginButton } from "@/components/StravaLoginButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { useStravaAuth } from "@/hooks/use-strava-auth";
import { useRouter } from "next/navigation";

export default function StravaAuthPage() {
    const { data, isLoading, error } = useStravaAuth();
    const router = useRouter();

    useEffect(() => {
        if (data?.isAuthenticated) {
            router.push("/");
        }
    }, [data?.isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col">
                <div className="flex w-full items-center justify-end gap-4 border-b px-8 py-4">
                    <ThemeSwitch />
                </div>

                <div className="flex flex-1 flex-col items-center justify-center p-24">
                    <div className="w-full max-w-md space-y-8">
                        <div className="text-center">
                            <Skeleton className="mx-auto mb-4 h-8 w-48" />
                            <Skeleton className="mx-auto h-4 w-64" />
                        </div>
                        <div className="flex justify-center">
                            <Skeleton className="h-12 w-48" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // If authenticated, show loading state while redirecting
    if (data?.isAuthenticated) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-24">
                <div className="text-center">
                    <h2 className="mb-4 text-2xl font-semibold">Redirecting to dashboard...</h2>
                    <div className="animate-pulse">
                        <Skeleton className="mx-auto h-4 w-32" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col">
            <div className="flex w-full items-center justify-end gap-4 border-b px-8 py-4">
                <ThemeSwitch />
            </div>

            <div className="flex flex-1 flex-col items-center justify-center p-24">
                <div className="w-full max-w-md space-y-8">
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>
                                Failed to verify authentication. Please try logging in again.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="text-center">
                        <h1 className="mb-2 text-4xl font-bold">Bike Stats</h1>
                        <h2 className="mb-4 text-2xl font-semibold">Connect with Strava</h2>
                        <p className="text-muted-foreground">
                            You need to connect your Strava account to access your cycling
                            statistics and dashboard.
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <StravaLoginButton />
                    </div>

                    <div className="text-muted-foreground text-center text-sm">
                        <p>
                            By connecting your Strava account, you'll be able to view your cycling
                            metrics, training history, and detailed analytics.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
