import { ZwoStep, ZwoWorkout, zwoWorkoutSchema } from "@/lib/zwo/types";
import { Workout, WorkoutSportType, WorkoutStep, WorkoutStepType } from "@prisma/client";

type DbWorkoutWithSteps = Workout & {
    steps: WorkoutStep[];
};

export type DbWorkoutPayload = {
    name: string;
    description: string;
    author: string;
    sport_type: WorkoutSportType;
    tags: string[];
    steps: Array<{
        position: number;
        type: WorkoutStepType;
        duration: number | null;
        power: number | null;
        power_low: number | null;
        power_high: number | null;
        repeat: number | null;
        on_duration: number | null;
        off_duration: number | null;
        on_power: number | null;
        off_power: number | null;
        timeoffset: number | null;
        message: string | null;
    }>;
};

function normalizeTags(tags: string[]): string[] {
    return Array.from(new Set(tags.map(tag => tag.trim()).filter(Boolean)));
}

function toDbStep(step: ZwoStep, position: number): DbWorkoutPayload["steps"][number] {
    const baseStep = {
        position,
        type: step.type as WorkoutStepType,
        duration: null,
        power: null,
        power_low: null,
        power_high: null,
        repeat: null,
        on_duration: null,
        off_duration: null,
        on_power: null,
        off_power: null,
        timeoffset: null,
        message: null,
    };

    switch (step.type) {
        case "Warmup":
        case "Cooldown":
        case "Ramp":
            return {
                ...baseStep,
                duration: step.Duration,
                power_low: step.PowerLow,
                power_high: step.PowerHigh,
            };
        case "SteadyState":
            return {
                ...baseStep,
                duration: step.Duration,
                power: step.Power,
            };
        case "IntervalsT":
            return {
                ...baseStep,
                repeat: step.Repeat,
                on_duration: step.OnDuration,
                off_duration: step.OffDuration,
                on_power: step.OnPower,
                off_power: step.OffPower,
            };
        case "TextEvent":
            return {
                ...baseStep,
                timeoffset: step.timeoffset,
                message: step.message,
            };
        default:
            return baseStep;
    }
}

function requireNumber(value: number | null, fieldName: string, type: WorkoutStepType): number {
    if (value === null || !Number.isFinite(value)) {
        throw new Error(`Missing ${fieldName} for step type ${type}`);
    }

    return value;
}

function requireString(value: string | null, fieldName: string, type: WorkoutStepType): string {
    if (!value) {
        throw new Error(`Missing ${fieldName} for step type ${type}`);
    }

    return value;
}

function fromDbStep(step: WorkoutStep): ZwoStep {
    switch (step.type) {
        case "Warmup":
        case "Cooldown":
        case "Ramp":
            return {
                type: step.type,
                Duration: requireNumber(step.duration, "duration", step.type),
                PowerLow: requireNumber(step.power_low, "power_low", step.type),
                PowerHigh: requireNumber(step.power_high, "power_high", step.type),
            };
        case "SteadyState":
            return {
                type: "SteadyState",
                Duration: requireNumber(step.duration, "duration", step.type),
                Power: requireNumber(step.power, "power", step.type),
            };
        case "IntervalsT":
            return {
                type: "IntervalsT",
                Repeat: requireNumber(step.repeat, "repeat", step.type),
                OnDuration: requireNumber(step.on_duration, "on_duration", step.type),
                OffDuration: requireNumber(step.off_duration, "off_duration", step.type),
                OnPower: requireNumber(step.on_power, "on_power", step.type),
                OffPower: requireNumber(step.off_power, "off_power", step.type),
            };
        case "TextEvent":
            return {
                type: "TextEvent",
                timeoffset: requireNumber(step.timeoffset, "timeoffset", step.type),
                message: requireString(step.message, "message", step.type),
            };
        default:
            throw new Error(`Unsupported workout step type: ${String(step.type)}`);
    }
}

export function toDbWorkout(zwoWorkout: unknown): DbWorkoutPayload {
    const parsedWorkout = zwoWorkoutSchema.parse(zwoWorkout);

    return {
        name: parsedWorkout.name,
        description: parsedWorkout.description,
        author: parsedWorkout.author,
        sport_type: WorkoutSportType.bike,
        tags: normalizeTags(parsedWorkout.tags),
        steps: parsedWorkout.steps.map((step, position) => toDbStep(step, position)),
    };
}

export function fromDbWorkout(dbWorkoutWithSteps: DbWorkoutWithSteps): ZwoWorkout {
    const workout = {
        name: dbWorkoutWithSteps.name,
        description: dbWorkoutWithSteps.description,
        author: dbWorkoutWithSteps.author,
        sportType: "bike" as const,
        tags: normalizeTags(dbWorkoutWithSteps.tags),
        steps: dbWorkoutWithSteps.steps.sort((a, b) => a.position - b.position).map(fromDbStep),
    };

    return zwoWorkoutSchema.parse(workout);
}
