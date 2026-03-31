import { getAuthenticatedUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fromDbWorkout, toDbWorkout } from "@/lib/zwo/persistence";
import { zwoWorkoutSchema } from "@/lib/zwo/types";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{
        workout_id: string;
    }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { workout_id: workoutId } = await context.params;
        const workout = await prisma.workout.findFirst({
            where: {
                id: workoutId,
                user_id: userId,
            },
            include: {
                steps: {
                    orderBy: { position: "asc" },
                },
            },
        });

        if (!workout) {
            return NextResponse.json({ error: "Workout not found" }, { status: 404 });
        }

        return NextResponse.json({
            workout: fromDbWorkout(workout),
            meta: {
                id: workout.id,
                createdAt: workout.created_at.toISOString(),
                updatedAt: workout.updated_at.toISOString(),
            },
        });
    } catch (error) {
        console.error("ZWO workout details error:", error);
        return NextResponse.json({ error: "Nie udało się pobrać treningu." }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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

        const { workout_id: workoutId } = await context.params;
        const existingWorkout = await prisma.workout.findFirst({
            where: {
                id: workoutId,
                user_id: userId,
            },
            select: { id: true },
        });

        if (!existingWorkout) {
            return NextResponse.json({ error: "Workout not found" }, { status: 404 });
        }

        const dbWorkout = toDbWorkout(workoutData.data);
        const updatedWorkout = await prisma.$transaction(async tx => {
            await tx.workoutStep.deleteMany({
                where: { workout_id: workoutId },
            });

            return tx.workout.update({
                where: { id: workoutId },
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
                select: {
                    id: true,
                    updated_at: true,
                },
            });
        });

        return NextResponse.json({
            workoutId: updatedWorkout.id,
            updatedAt: updatedWorkout.updated_at.toISOString(),
        });
    } catch (error) {
        console.error("ZWO workout update error:", error);
        return NextResponse.json(
            { error: "Nie udało się zaktualizować treningu." },
            { status: 500 },
        );
    }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { workout_id: workoutId } = await context.params;
        const deleted = await prisma.workout.deleteMany({
            where: {
                id: workoutId,
                user_id: userId,
            },
        });

        if (deleted.count === 0) {
            return NextResponse.json({ error: "Workout not found" }, { status: 404 });
        }

        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error("ZWO workout delete error:", error);
        return NextResponse.json({ error: "Nie udało się usunąć treningu." }, { status: 500 });
    }
}
