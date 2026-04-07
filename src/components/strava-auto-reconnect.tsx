"use client";

import { useEffect } from "react";
import { useStravaAuth } from "@/hooks/use-strava-auth";

const SESSION_KEY = "strava_auto_oauth_attempt_v1";

/** Wywołaj przy ręcznym starcie OAuth, żeby ponowić próbę po nieudanym automacie. */
export function clearStravaAutoReconnectAttempt() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Gdy użytkownik jest zalogowany do aplikacji, ma w bazie dane Stravy, ale brak ważnych
 * tokenów w ciasteczkach — jednorazowo przekierowuje do OAuth Stravy (bez pętli w tej samej sesji).
 */
export function StravaAutoReconnect() {
    const { data, isLoading } = useStravaAuth();

    useEffect(() => {
        if (typeof window === "undefined" || isLoading || !data) return;

        if (data.isAuthenticated) {
            sessionStorage.removeItem(SESSION_KEY);
            return;
        }

        if (!data.suggestStravaReconnect) return;
        if (sessionStorage.getItem(SESSION_KEY)) return;

        sessionStorage.setItem(SESSION_KEY, "1");
        window.location.assign("/api/auth/strava");
    }, [data, isLoading]);

    return null;
}
