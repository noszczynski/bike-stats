"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStravaActivities, useStravaAthlete } from "@/hooks/use-strava-queries";
import { StravaActivity } from "@/types/strava";
import Link from "next/link";

interface StravaProfileClientProps {
    searchParams: {
        error?: string;
    };
}

export default function StravaProfileClient({ searchParams }: StravaProfileClientProps) {
    const { data: athlete, isLoading: isAthleteLoading, error: athleteError } = useStravaAthlete();

    const {
        data: activities,
        isLoading: isActivitiesLoading,
        error: activitiesError,
    } = useStravaActivities(100);

    const bikeActivities =
        activities?.filter(
            (activity: StravaActivity) =>
                activity.sport_type === "Ride" || activity.sport_type === "VirtualRide",
        ) || [];

    if (isAthleteLoading || isActivitiesLoading) {
        return (
            <main className="flex min-h-screen flex-col items-center p-24">
                <div className="w-full max-w-4xl space-y-8">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <div className="grid gap-8 md:grid-cols-2">
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-40" />
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-16 w-16 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-64" />
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-4 w-56" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-36" />
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (athleteError || activitiesError) {
        return (
            <main className="flex min-h-screen flex-col items-center p-24">
                <div className="w-full max-w-4xl space-y-8">
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            Failed to load profile data. Please try again later or reconnect your
                            Strava account.
                        </AlertDescription>
                    </Alert>
                    <div className="flex items-center justify-center">
                        <Link href="/">
                            <Button variant="outline">Back to Home</Button>
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-24">
            <div className="w-full max-w-4xl space-y-8">
                {searchParams.error === "failed_to_fetch_athlete" && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            Failed to fetch athlete data. Please try again later or reconnect your
                            Strava account.
                        </AlertDescription>
                    </Alert>
                )}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Strava Profile</h1>
                    <Link href="/">
                        <Button variant="outline">Back to Home</Button>
                    </Link>
                </div>
                <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Profile Information</h2>
                        <div className="flex items-center gap-4">
                            <img
                                src={athlete?.profile}
                                alt={`${athlete?.firstname} ${athlete?.lastname}`}
                                className="h-16 w-16 rounded-full"
                            />
                            <div>
                                <p className="text-lg font-medium">
                                    {athlete?.firstname} {athlete?.lastname}
                                </p>
                                {athlete?.username && (
                                    <p className="text-muted-foreground text-sm">
                                        @{athlete?.username}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p>
                                <span className="font-medium">Location:</span> {athlete?.city},{" "}
                                {athlete?.country}
                            </p>
                            <p>
                                <span className="font-medium">Premium:</span>{" "}
                                {athlete?.premium ? "Yes" : "No"}
                            </p>
                            <p>
                                <span className="font-medium">Summit:</span>{" "}
                                {athlete?.summit ? "Yes" : "No"}
                            </p>
                            {athlete?.bio && (
                                <p>
                                    <span className="font-medium">Bio:</span> {athlete?.bio}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Recent Activities</h2>
                        {bikeActivities.length > 0 ? (
                            <div className="space-y-2">
                                {bikeActivities.slice(0, 5).map((activity: StravaActivity) => (
                                    <div
                                        key={activity.id}
                                        className="border-border rounded-lg border p-3"
                                    >
                                        <h3 className="font-medium">{activity.name}</h3>
                                        <p className="text-muted-foreground text-sm">
                                            {new Date(activity.start_date).toLocaleDateString()} •{" "}
                                            {(activity.distance / 1000).toFixed(1)} km
                                        </p>
                                    </div>
                                ))}
                                {bikeActivities.length > 5 && (
                                    <p className="text-muted-foreground text-sm">
                                        And {bikeActivities.length - 5} more activities...
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No bike activities found.</p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
