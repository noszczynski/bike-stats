import { ZwoStep, ZwoWorkout } from "@/lib/zwo/types";

export type StepType = ZwoStep["type"];

export const STEP_TYPES: StepType[] = [
    "Warmup",
    "Cooldown",
    "SteadyState",
    "Ramp",
    "IntervalsT",
    "TextEvent",
];

export const DEFAULT_WORKOUT: ZwoWorkout = {
    name: "Nowy workout",
    description: "Wygenerowany w Bike Stats",
    author: "Bike Stats",
    sportType: "bike",
    tags: [],
    steps: [{ type: "SteadyState", Duration: 900, Power: 0.7 }],
};

export function createDefaultStep(type: StepType): ZwoStep {
    switch (type) {
        case "Warmup":
            return { type, Duration: 600, PowerLow: 0.5, PowerHigh: 0.75 };
        case "Cooldown":
            return { type, Duration: 600, PowerLow: 0.6, PowerHigh: 0.45 };
        case "SteadyState":
            return { type, Duration: 900, Power: 0.75 };
        case "Ramp":
            return { type, Duration: 600, PowerLow: 0.6, PowerHigh: 0.95 };
        case "IntervalsT":
            return {
                type,
                Repeat: 5,
                OnDuration: 120,
                OffDuration: 120,
                OnPower: 1.1,
                OffPower: 0.6,
            };
        case "TextEvent":
            return { type, timeoffset: 30, message: "Trzymaj tempo!" };
        default:
            return { type: "SteadyState", Duration: 900, Power: 0.75 };
    }
}

export function getStepDurationSeconds(step: ZwoStep): number {
    switch (step.type) {
        case "Warmup":
        case "Cooldown":
        case "SteadyState":
        case "Ramp":
            return step.Duration;
        case "IntervalsT":
            return step.Repeat * (step.OnDuration + step.OffDuration);
        case "TextEvent":
            return 0;
        default:
            return 0;
    }
}

export function getWorkoutDurationSeconds(workout: ZwoWorkout): number {
    return workout.steps.reduce((sum, step) => sum + getStepDurationSeconds(step), 0);
}

export function formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours} h ${minutes} min`;
    }

    if (minutes > 0) {
        return `${minutes} min`;
    }

    return `${seconds} s`;
}

export function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat("pl-PL", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export function duplicateWorkoutName(name: string): string {
    return `${name} (kopia)`;
}
