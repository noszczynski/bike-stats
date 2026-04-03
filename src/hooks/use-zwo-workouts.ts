"use client";

import { WorkoutPreviewBlock } from "@/lib/zwo/workout-summary";
import { ZwoWorkout } from "@/lib/zwo/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ZwoWorkoutListItem = {
    id: string;
    name: string;
    description: string;
    author: string;
    tags: string[];
    stepsCount: number;
    estimatedDurationSeconds: number;
    difficulty: number;
    previewBlocks: WorkoutPreviewBlock[];
    createdAt: string;
    updatedAt: string;
};

export type WorkoutDetailsResponse = {
    workout: ZwoWorkout;
    meta: {
        id: string;
        createdAt: string;
        updatedAt: string;
    };
};

type UploadWorkoutToHammerheadResponse = {
    success: true;
    workoutId: string;
    name: string;
    plannedDate: string | null;
    createdAt: string;
    updatedAt: string;
};

const zwoWorkoutQueryKeys = {
    all: ["zwo-workouts"] as const,
    details: (workoutId: string) => ["zwo-workouts", workoutId] as const,
};

function getApiErrorMessage(payload: unknown, fallbackMessage: string): string {
    if (typeof payload !== "object" || payload === null) {
        return fallbackMessage;
    }

    if ("error" in payload && typeof payload.error === "string") {
        return payload.error;
    }

    return fallbackMessage;
}

export function useZwoWorkouts() {
    return useQuery({
        queryKey: zwoWorkoutQueryKeys.all,
        queryFn: async () => {
            const response = await fetch("/api/zwo/workouts");
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(
                    getApiErrorMessage(payload, "Nie udało się pobrać listy treningów."),
                );
            }

            return payload.workouts as ZwoWorkoutListItem[];
        },
    });
}

export function useZwoWorkout(workoutId: string | null) {
    return useQuery({
        queryKey: zwoWorkoutQueryKeys.details(workoutId ?? "empty"),
        enabled: Boolean(workoutId),
        queryFn: async () => {
            const response = await fetch(`/api/zwo/workouts/${workoutId}`);
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(getApiErrorMessage(payload, "Nie udało się pobrać treningu."));
            }

            return payload as WorkoutDetailsResponse;
        },
    });
}

export function useCreateZwoWorkout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (workout: ZwoWorkout) => {
            const response = await fetch("/api/zwo/workouts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ workout }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(getApiErrorMessage(payload, "Nie udało się zapisać treningu."));
            }

            return payload as { workoutId: string; createdAt: string; updatedAt: string };
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: zwoWorkoutQueryKeys.all });
        },
    });
}

export function useUpdateZwoWorkout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ workoutId, workout }: { workoutId: string; workout: ZwoWorkout }) => {
            const response = await fetch(`/api/zwo/workouts/${workoutId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ workout }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(
                    getApiErrorMessage(payload, "Nie udało się zaktualizować treningu."),
                );
            }

            return payload as { workoutId: string; updatedAt: string };
        },
        onSuccess: (_result, variables) => {
            void queryClient.invalidateQueries({ queryKey: zwoWorkoutQueryKeys.all });
            void queryClient.invalidateQueries({
                queryKey: zwoWorkoutQueryKeys.details(variables.workoutId),
            });
        },
    });
}

export function useDeleteZwoWorkout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (workoutId: string) => {
            const response = await fetch(`/api/zwo/workouts/${workoutId}`, {
                method: "DELETE",
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(getApiErrorMessage(payload, "Nie udało się usunąć treningu."));
            }

            return payload as { deleted: true };
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: zwoWorkoutQueryKeys.all });
        },
    });
}

export function useLoadZwoWorkout() {
    return useMutation({
        mutationFn: async (workoutId: string) => {
            const response = await fetch(`/api/zwo/workouts/${workoutId}`);
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(getApiErrorMessage(payload, "Nie udało się pobrać treningu."));
            }

            return payload as WorkoutDetailsResponse;
        },
    });
}

export function useUploadZwoWorkoutToHammerhead() {
    return useMutation({
        mutationFn: async (workout: ZwoWorkout) => {
            const response = await fetch("/api/zwo/workouts/hammerhead", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ workout }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(
                    getApiErrorMessage(payload, "Nie udało się wysłać treningu do Hammerhead."),
                );
            }

            return payload as UploadWorkoutToHammerheadResponse;
        },
    });
}
