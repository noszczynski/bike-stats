"use client";

import { useQuery } from "@tanstack/react-query";

interface HammerheadAuthStatus {
    isAuthenticated: boolean;
}

async function checkHammerheadAuthStatus(): Promise<HammerheadAuthStatus> {
    const response = await fetch("/api/auth/hammerhead/status", {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Failed to check Hammerhead authentication status");
    }

    return response.json();
}

export function useHammerheadAuth() {
    return useQuery({
        queryKey: ["hammerhead-auth-status"],
        queryFn: checkHammerheadAuthStatus,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: (failureCount, error) => {
            if (error.message.includes("Failed to check Hammerhead authentication status")) {
                return failureCount < 2;
            }
            return false;
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
}
