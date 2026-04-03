import { fromDbWorkout } from "@/lib/zwo/persistence";
import { Prisma, WorkoutStep } from "@prisma/client";

export const workoutWithStepsInclude = {
    steps: {
        orderBy: {
            position: "asc" as const,
        },
    },
} satisfies Prisma.WorkoutInclude;

type WorkoutWithSteps = Prisma.WorkoutGetPayload<{
    include: typeof workoutWithStepsInclude;
}>;

function estimateStepDurationSeconds(step: WorkoutStep): number {
    switch (step.type) {
        case "Warmup":
        case "Cooldown":
        case "SteadyState":
        case "Ramp":
            return step.duration ?? 0;
        case "IntervalsT":
            return (step.repeat ?? 0) * ((step.on_duration ?? 0) + (step.off_duration ?? 0));
        case "TextEvent":
            return 0;
        default:
            return 0;
    }
}

export function formatWorkoutDetails(workout: WorkoutWithSteps) {
    return {
        id: workout.id,
        name: workout.name,
        description: workout.description,
        author: workout.author,
        sportType: workout.sport_type,
        tags: workout.tags,
        stepsCount: workout.steps.length,
        estimatedDurationSeconds: workout.steps.reduce(
            (sum, step) => sum + estimateStepDurationSeconds(step),
            0,
        ),
        createdAt: workout.created_at.toISOString(),
        updatedAt: workout.updated_at.toISOString(),
        workout: fromDbWorkout(workout),
    };
}
