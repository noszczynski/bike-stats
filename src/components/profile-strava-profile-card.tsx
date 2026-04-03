"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StravaAthlete } from "@/types/strava";

export function StravaProfileCard({ athlete }: { athlete: StravaAthlete }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Profil</CardTitle>
                <CardDescription>Dane z połączonego konta Strava.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <img
                            src={athlete.profile}
                            alt={`${athlete.firstname} ${athlete.lastname}`}
                            className="h-16 w-16 rounded-full"
                        />
                        <div>
                            <p className="text-lg font-medium">
                                {athlete.firstname} {athlete.lastname}
                            </p>
                            {athlete.username && (
                                <p className="text-muted-foreground text-sm">@{athlete.username}</p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p>
                            <span className="font-medium">Lokalizacja:</span> {athlete.city},{" "}
                            {athlete.country}
                        </p>
                        <p>
                            <span className="font-medium">Premium:</span>{" "}
                            {athlete.premium ? "Tak" : "Nie"}
                        </p>
                        <p>
                            <span className="font-medium">Summit:</span>{" "}
                            {athlete.summit ? "Tak" : "Nie"}
                        </p>
                        {athlete.bio && (
                            <p>
                                <span className="font-medium">Bio:</span> {athlete.bio}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function StravaProfileCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-4 w-full max-w-md" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
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
            </CardContent>
        </Card>
    );
}
