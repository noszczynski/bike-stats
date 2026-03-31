"use client";

import { ZwoWorkout } from "@/lib/zwo/types";
import { useMutation } from "@tanstack/react-query";

type GenerateWorkoutPayload = {
    instruction: string;
    currentWorkout?: Partial<ZwoWorkout>;
};

type GenerateWorkoutResponse = {
    workout: ZwoWorkout;
};

function getApiErrorMessage(payload: unknown): string {
    if (typeof payload !== "object" || payload === null) {
        return "Nie udało się wygenerować treningu.";
    }

    if ("error" in payload && typeof payload.error === "string") {
        return payload.error;
    }

    return "Nie udało się wygenerować treningu.";
}

export function useZwoGenerate() {
    return useMutation({
        mutationFn: async ({ instruction, currentWorkout }: GenerateWorkoutPayload) => {
            const response = await fetch("/api/zwo/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ instruction, currentWorkout }),
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(getApiErrorMessage(payload));
            }

            return payload as GenerateWorkoutResponse;
        },
    });
}
