import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { training_id: string } }) {
    try {
        // Authenticate user
        const user = await getAuthenticatedUser({
            id: true,
        });

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { notes } = body;

        // Validate notes length
        if (notes && notes.length > 2048) {
            return NextResponse.json(
                { error: "Notes cannot exceed 2048 characters" },
                { status: 400 },
            );
        }

        // Check if training exists and belongs to user
        const training = await prisma.activity.findFirst({
            where: {
                id: params.training_id,
                user_id: user.id,
            },
            select: {
                id: true,
                notes: true,
            },
        });

        if (!training) {
            return NextResponse.json({ error: "Training not found" }, { status: 404 });
        }

        const updatedTraining = await prisma.activity.update({
            where: {
                id: params.training_id,
            },
            data: {
                notes,
            },
            select: {
                id: true,
                notes: true,
            },
        });

        return NextResponse.json({ training: updatedTraining }, { status: 200 });
    } catch (error) {
        console.error("Update notes error:", error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: "Internal server error", details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
