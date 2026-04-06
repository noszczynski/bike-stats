"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface StravaAuthStatus {
    isAuthenticated: boolean;
    /** Zalogowany użytkownik aplikacji ma dane Stravy w bazie, ale brak ważnej sesji Stravy — można zaproponować OAuth. */
    suggestStravaReconnect?: boolean;
}

async function checkStravaAuthStatus(): Promise<StravaAuthStatus> {
    const response = await fetch("/api/auth/strava/status", {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Failed to check authentication status");
    }

    return response.json();
}

async function disconnectStrava(): Promise<void> {
    const response = await fetch("/api/auth/strava/logout", { method: "POST" });

    if (!response.ok) {
        throw new Error("Nie udało się odłączyć konta Strava");
    }
}

export function useDisconnectStrava() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: disconnectStrava,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["strava-auth-status"] });
            void queryClient.invalidateQueries({ queryKey: ["strava-athlete"] });
            void queryClient.invalidateQueries({ queryKey: ["strava-activities"] });
            void queryClient.invalidateQueries({ queryKey: ["strava-routes"] });
        },
    });
}

export function useStravaAuth() {
    return useQuery({
        queryKey: ["strava-auth-status"],
        queryFn: checkStravaAuthStatus,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 2 * 60 * 1000, // 2 minutes (shorter to catch token expiration faster)
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error) => {
            // Don't retry on auth failures, but retry on network errors
            if (error.message.includes("Failed to check authentication status")) {
                return failureCount < 2;
            }

            return false;
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
}
