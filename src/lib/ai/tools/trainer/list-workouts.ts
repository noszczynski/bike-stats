import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const inputSchema = z.object({
    limit: z.number().int().min(1).max(50).optional().describe("Domyślnie 10, maksymalnie 50"),
    query: z
        .string()
        .trim()
        .min(1)
        .max(120)
        .optional()
        .describe("Szukaj po nazwie, opisie lub autorze treningu"),
});

export function createListWorkoutsTool(userId: string) {
    return createLoggedTool({
        name: "list_workouts",
        description:
            "Lista zapisanych treningów użytkownika w edytorze treningów. Przydatne do przeglądu, wyszukania i wyboru treningu do dalszej edycji.",
        inputSchema,
        execute: async input => {
            const limit = input.limit ?? 10;
            const workouts = await prisma.workout.findMany({
                where: {
                    user_id: userId,
                    ...(input.query
                        ? {
                              OR: [
                                  { name: { contains: input.query, mode: "insensitive" } },
                                  { description: { contains: input.query, mode: "insensitive" } },
                                  { author: { contains: input.query, mode: "insensitive" } },
                              ],
                          }
                        : {}),
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    author: true,
                    sport_type: true,
                    tags: true,
                    created_at: true,
                    updated_at: true,
                    _count: {
                        select: {
                            steps: true,
                        },
                    },
                },
                orderBy: { updated_at: "desc" },
                take: limit,
            });

            return {
                count: workouts.length,
                filters: {
                    limit,
                    query: input.query ?? null,
                    tag: input.tag ?? null,
                },
                workouts: workouts.map(workout => ({
                    id: workout.id,
                    name: workout.name,
                    description: workout.description,
                    author: workout.author,
                    sportType: workout.sport_type,
                    tags: workout.tags,
                    stepsCount: workout._count.steps,
                    createdAt: workout.created_at.toISOString(),
                    updatedAt: workout.updated_at.toISOString(),
                })),
            };
        },
    });
}
