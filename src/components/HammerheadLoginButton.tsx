"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/submit-button";

export function HammerheadLoginButton() {
    const [isNavigating, setIsNavigating] = useState(false);

    return (
        <SubmitButton
            isLoading={isNavigating}
            onClick={() => {
                setIsNavigating(true);
                window.location.href = "/api/auth/hammerhead";
            }}
        >
            Połącz z Hammerhead
        </SubmitButton>
    );
}
