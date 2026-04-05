import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export function createDeleteWorkoutTool(userId: string) {
    return createLoggedTool({
        name: "delete_workout",
        description: "Usuwa zapisany trening użytkownika po jego ID.",
        inputSchema: z.object({
            workout_id: z.string().uuid().describe("ID zapisanego treningu do usunięcia"),
        }),
        execute: async ({ workout_id }) => {
            const workout = await prisma.workout.findFirst({
                where: {
                    id: workout_id,
                    user_id: userId,
                },
                select: {
                    id: true,
                    name: true,
                },
            });

            if (!workout) {
                throw new Error("Workout not found");
            }

            await prisma.workout.delete({
                where: {
                    id: workout_id,
                },
            });

            return {
                deleted: true,
                workout: {
                    id: workout.id,
                    name: workout.name,
                },
            };
        },
    });
}
