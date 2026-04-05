import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { formatWorkoutDetails, workoutWithStepsInclude } from "@/lib/ai/tools/trainer/workout-tool-utils";
import { prisma } from "@/lib/prisma";
import { toDbWorkout } from "@/lib/zwo/persistence";
import { zwoWorkoutSchema } from "@/lib/zwo/types";

export function createCreateWorkoutTool(userId: string) {
    return createLoggedTool({
        name: "create_workout",
        description:
            "Tworzy nowy zapisany trening użytkownika wraz z krokami treningu. Użyj, gdy użytkownik chce zapisać nowy trening.",
        inputSchema: zwoWorkoutSchema,
        execute: async input => {
            const dbWorkout = toDbWorkout(input);
            const createdWorkout = await prisma.workout.create({
                data: {
                    user_id: userId,
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
                select: {
                    id: true,
                },
            });

            const workout = await prisma.workout.findFirst({
                where: {
                    id: createdWorkout.id,
                    user_id: userId,
                },
                include: workoutWithStepsInclude,
            });

            if (!workout) {
                throw new Error("Workout not found after create");
            }

            return {
                created: true,
                ...formatWorkoutDetails(workout),
            };
        },
    });
}
