import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { formatWorkoutDetails, workoutWithStepsInclude } from "@/lib/ai/tools/trainer/workout-tool-utils";
import { prisma } from "@/lib/prisma";
import { toDbWorkout } from "@/lib/zwo/persistence";
import { zwoWorkoutSchema } from "@/lib/zwo/types";
import { z } from "zod";

const inputSchema = zwoWorkoutSchema.extend({
    workout_id: z.string().uuid().describe("ID zapisanego treningu do nadpisania"),
});

export function createUpdateWorkoutTool(userId: string) {
    return createLoggedTool({
        name: "update_workout",
        description:
            "Aktualizuje istniejący zapisany trening użytkownika i nadpisuje jego listę kroków.",
        inputSchema,
        execute: async ({ workout_id, ...workoutInput }) => {
            const existingWorkout = await prisma.workout.findFirst({
                where: {
                    id: workout_id,
                    user_id: userId,
                },
                select: {
                    id: true,
                },
            });

            if (!existingWorkout) {
                throw new Error("Workout not found");
            }

            const dbWorkout = toDbWorkout(workoutInput);
            await prisma.$transaction(async tx => {
                await tx.workoutStep.deleteMany({
                    where: {
                        workout_id,
                    },
                });

                await tx.workout.update({
                    where: {
                        id: workout_id,
                    },
                    data: {
                        name: dbWorkout.name,
                        description: dbWorkout.description,
                        author: dbWorkout.author,
                        sport_type: dbWorkout.sport_type,
                        tags: dbWorkout.tags,
                        steps: {
                            createMany: {
                                data: dbWorkout.steps,
                            },
                        },
                    },
                });
            });

            const workout = await prisma.workout.findFirst({
                where: {
                    id: workout_id,
                    user_id: userId,
                },
                include: workoutWithStepsInclude,
            });

            if (!workout) {
                throw new Error("Workout not found after update");
            }

            return {
                updated: true,
                ...formatWorkoutDetails(workout),
            };
        },
    });
}
