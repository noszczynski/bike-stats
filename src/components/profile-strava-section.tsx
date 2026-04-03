"use client";

import { StravaLoginButton } from "@/components/StravaLoginButton";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDisconnectStrava, useStravaAuth } from "@/hooks/use-strava-auth";
import { useStravaAthlete } from "@/hooks/use-strava-queries";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function ProfileStravaSection() {
    const { data, isLoading, error, refetch } = useStravaAuth();
    const disconnectMutation = useDisconnectStrava();
    const isConnected = data?.isAuthenticated === true;

    const athleteQuery = useStravaAthlete({
        enabled: isConnected,
    });

    function handleRefresh() {
        void refetch();
        if (isConnected) {
            void athleteQuery.refetch();
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Strava</CardTitle>
                <CardDescription>
                    Połącz konto Strava, aby importować treningi i synchronizować dane
                    zawodnika.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading && <Skeleton className="h-10 max-w-md" />}
                {error && (
                    <p className="text-destructive text-sm">
                        Nie udało się sprawdzić statusu połączenia. Spróbuj ponownie później.
                    </p>
                )}
                {!isLoading && !error && (
                    <>
                        <p className="text-sm">
                            {data?.isAuthenticated ? (
                                <span className="font-medium text-green-700 dark:text-green-500">
                                    Status: połączono
                                </span>
                            ) : (
                                <span className="text-muted-foreground">Status: nie połączono</span>
                            )}
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {!data?.isAuthenticated ? (
                                <StravaLoginButton />
                            ) : (
                                <SubmitButton
                                    type="button"
                                    variant="outline"
                                    isLoading={disconnectMutation.isPending}
                                    loadingText="Odłączanie…"
                                    onClick={() =>
                                        disconnectMutation.mutate(undefined, {
                                            onSuccess: () =>
                                                toast.success("Konto Strava zostało odłączone."),
                                            onError: e =>
                                                toast.error(
                                                    e instanceof Error ? e.message : "Błąd odłączania",
                                                ),
                                        })
                                    }
                                >
                                    <LogOut />
                                    Odłącz konto Strava
                                </SubmitButton>
                            )}
                            <Button type="button" variant="ghost" onClick={() => void handleRefresh()}>
                                Odśwież status
                            </Button>
                        </div>

                        {isConnected && athleteQuery.isLoading && (
                            <div className="space-y-4 border-border border-t pt-4">
                                <Skeleton className="h-7 w-40" />
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
                                </div>
                            </div>
                        )}

                        {isConnected && athleteQuery.error && (
                            <p className="text-destructive text-sm">
                                Nie udało się wczytać profilu Stravy. Spróbuj odświeżyć status.
                            </p>
                        )}

                        {isConnected && athleteQuery.data && (
                            <div className="space-y-4 border-border border-t pt-4">
                                <h2 className="text-xl font-semibold">Profil</h2>
                                <div className="flex items-center gap-4">
                                    <img
                                        src={athleteQuery.data.profile}
                                        alt={`${athleteQuery.data.firstname} ${athleteQuery.data.lastname}`}
                                        className="h-16 w-16 rounded-full"
                                    />
                                    <div>
                                        <p className="text-lg font-medium">
                                            {athleteQuery.data.firstname} {athleteQuery.data.lastname}
                                        </p>
                                        {athleteQuery.data.username && (
                                            <p className="text-muted-foreground text-sm">
                                                @{athleteQuery.data.username}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p>
                                        <span className="font-medium">Lokalizacja:</span>{" "}
                                        {athleteQuery.data.city}, {athleteQuery.data.country}
                                    </p>
                                    <p>
                                        <span className="font-medium">Premium:</span>{" "}
                                        {athleteQuery.data.premium ? "Tak" : "Nie"}
                                    </p>
                                    <p>
                                        <span className="font-medium">Summit:</span>{" "}
                                        {athleteQuery.data.summit ? "Tak" : "Nie"}
                                    </p>
                                    {athleteQuery.data.bio && (
                                        <p>
                                            <span className="font-medium">Bio:</span>{" "}
                                            {athleteQuery.data.bio}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
