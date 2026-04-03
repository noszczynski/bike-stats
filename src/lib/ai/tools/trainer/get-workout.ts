import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { formatWorkoutDetails, workoutWithStepsInclude } from "@/lib/ai/tools/trainer/workout-tool-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export function createGetWorkoutTool(userId: string) {
    return createLoggedTool({
        name: "get_workout",
        description:
            "Szczegóły jednego zapisanego treningu użytkownika razem z pełną listą kroków i metadanymi.",
        inputSchema: z.object({
            workout_id: z.string().uuid().describe("ID zapisanego treningu"),
        }),
        execute: async ({ workout_id }) => {
            const workout = await prisma.workout.findFirst({
                where: {
                    id: workout_id,
                    user_id: userId,
                },
                include: workoutWithStepsInclude,
            });

            if (!workout) {
                throw new Error("Workout not found");
            }

            return formatWorkoutDetails(workout);
        },
    });
}
