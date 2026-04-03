"use client";

import { Button } from "@/components/ui/button";

export function HammerheadLoginButton() {
    return (
        <Button
            onClick={() => {
                window.location.href = "/api/auth/hammerhead";
            }}
        >
            Połącz z Hammerhead
        </Button>
    );
}
