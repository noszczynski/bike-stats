import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
    params: {
        training_id: string;
    };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getAuthenticatedUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { training_id } = params;

        // Check if activity belongs to the user
        const activity = await prisma.activity.findUnique({
            where: {
                id: training_id,
                user_id: user.id,
            },
        });

        if (!activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        const activityTags = await prisma.activityTag.findMany({
            where: {
                activity_id: training_id,
            },
            include: {
                tag: true,
            },
            orderBy: {
                created_at: "desc",
            },
        });

        return NextResponse.json(activityTags);
    } catch (error) {
        console.error("Error fetching activity tags:", error);
        return NextResponse.json({ error: "Failed to fetch activity tags" }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getAuthenticatedUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { training_id } = params;
        const body = await request.json();
        const { tagId } = body;

        if (!tagId) {
            return NextResponse.json({ error: "Tag ID is required" }, { status: 400 });
        }

        // Check if activity exists and belongs to user
        const activity = await prisma.activity.findUnique({
            where: {
                id: training_id,
                user_id: user.id,
            },
        });

        if (!activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        // Check if tag exists
        const tag = await prisma.tag.findUnique({
            where: { id: tagId },
        });

        if (!tag) {
            return NextResponse.json({ error: "Tag not found" }, { status: 404 });
        }

        // Check if activity tag relationship already exists
        const existingActivityTag = await prisma.activityTag.findUnique({
            where: {
                activity_id_tag_id: {
                    activity_id: training_id,
                    tag_id: tagId,
                },
            },
        });

        if (existingActivityTag) {
            return NextResponse.json(
                { error: "Tag already added to this activity" },
                { status: 409 },
            );
        }

        const activityTag = await prisma.activityTag.create({
            data: {
                activity_id: training_id,
                tag_id: tagId,
                is_auto_generated: false,
            },
            include: {
                tag: true,
            },
        });

        return NextResponse.json(activityTag, { status: 201 });
    } catch (error) {
        console.error("Error adding tag to activity:", error);
        return NextResponse.json({ error: "Failed to add tag to activity" }, { status: 500 });
    }
}
