import { reapplyAutoTagging } from "@/features/training/auto-tagging-rules";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
    params: {
        training_id: string;
    };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getAuthenticatedUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { training_id } = params;

        // Check if activity belongs to user
        const activity = await prisma.activity.findUnique({
            where: {
                id: training_id,
                user_id: user.id,
            },
        });

        if (!activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        await reapplyAutoTagging(training_id);

        return NextResponse.json({
            message: "Auto tags reapplied successfully",
        });
    } catch (error) {
        console.error("Error reapplying auto tags:", error);
        return NextResponse.json({ error: "Failed to reapply auto tags" }, { status: 500 });
    }
}
