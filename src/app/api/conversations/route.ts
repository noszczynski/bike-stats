import { getAuthenticatedUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
        where: { user_id: userId },
        orderBy: { updated_at: "desc" },
        select: {
            id: true,
            title: true,
            created_at: true,
            updated_at: true,
        },
        take: 100,
    });

    return NextResponse.json({
        conversations: conversations.map(c => ({
            id: c.id,
            title: c.title,
            createdAt: c.created_at.toISOString(),
            updatedAt: c.updated_at.toISOString(),
        })),
    });
}
