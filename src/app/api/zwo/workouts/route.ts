import { getAuthenticatedUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarizeDbWorkoutSteps } from "@/lib/zwo/workout-summary";
import { toDbWorkout } from "@/lib/zwo/persistence";
import { zwoWorkoutSchema } from "@/lib/zwo/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const workouts = await prisma.workout.findMany({
            where: { user_id: userId },
            select: {
                id: true,
                name: true,
                description: true,
                author: true,
                tags: true,
                created_at: true,
                updated_at: true,
                steps: {
                    orderBy: { position: "asc" },
                    select: {
                        type: true,
                        duration: true,
                        power: true,
                        power_low: true,
                        power_high: true,
                        repeat: true,
                        on_duration: true,
                        off_duration: true,
                        on_power: true,
                        off_power: true,
                    },
                },
            },
            orderBy: { updated_at: "desc" },
        });

        return NextResponse.json({
            workouts: workouts.map(workout => {
                const summary = summarizeDbWorkoutSteps(workout.steps);

                return {
                    id: workout.id,
                    name: workout.name,
                    description: workout.description,
                    author: workout.author,
                    tags: workout.tags,
                    stepsCount: workout.steps.length,
                    estimatedDurationSeconds: summary.estimatedDurationSeconds,
                    difficulty: summary.difficulty,
                    previewBlocks: summary.previewBlocks,
                    createdAt: workout.created_at.toISOString(),
                    updatedAt: workout.updated_at.toISOString(),
                };
            }),
        });
    } catch (error) {
        console.error("ZWO workouts list error:", error);
        return NextResponse.json(
            { error: "Nie udało się pobrać zapisanych treningów." },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await request.json();
        const workoutData = zwoWorkoutSchema.safeParse(payload?.workout ?? payload);

        if (!workoutData.success) {
            return NextResponse.json(
                { error: "Invalid workout payload", details: workoutData.error.flatten() },
                { status: 400 },
            );
        }

        const dbWorkout = toDbWorkout(workoutData.data);
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
                created_at: true,
                updated_at: true,
            },
        });

        return NextResponse.json(
            {
                workoutId: createdWorkout.id,
                createdAt: createdWorkout.created_at.toISOString(),
                updatedAt: createdWorkout.updated_at.toISOString(),
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("ZWO workout create error:", error);
        return NextResponse.json({ error: "Nie udało się zapisać treningu." }, { status: 500 });
    }
}
