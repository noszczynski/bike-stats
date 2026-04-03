"use client";

import { RouteCards } from "@/components/route-card";
import { SubmitButton } from "@/components/submit-button";
import { useStravaRoutes } from "@/hooks/use-strava-queries";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";

export default function RoutesPage() {
    const queryClient = useQueryClient();
    const { data: routes = [], isLoading, isFetching } = useStravaRoutes();

    const handleRefresh = async () => {
        await queryClient.invalidateQueries({ queryKey: ["strava-routes"] });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Moje trasy publiczne</h1>
                    <p className="text-muted-foreground">Znaleziono {routes.length} tras</p>
                </div>
                <SubmitButton
                    onClick={() => void handleRefresh()}
                    isLoading={isFetching}
                    loadingText="Odświeżanie…"
                    variant="outline"
                >
                    <RefreshCw className="h-4 w-4" />
                    Odśwież
                </SubmitButton>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : routes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground text-lg">
                        {routes.length === 0
                            ? "Nie znaleziono żadnych tras"
                            : "Brak tras spełniających kryteria filtrowania"}
                    </p>
                </div>
            ) : (
                <RouteCards routes={routes} />
            )}
        </div>
    );
}
