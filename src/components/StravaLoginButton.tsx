"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/submit-button";

export function StravaLoginButton() {
    const [isNavigating, setIsNavigating] = useState(false);

    return (
        <SubmitButton
            isLoading={isNavigating}
            onClick={() => {
                setIsNavigating(true);
                window.location.href = "/api/auth/strava";
            }}
            className="bg-[#FC4C02] text-white hover:bg-[#FC4C02]/90"
        >
            Connect with Strava
        </SubmitButton>
    );
}
