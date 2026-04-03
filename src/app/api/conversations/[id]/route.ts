import { getAuthenticatedUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const conversation = await prisma.conversation.findFirst({
        where: { id, user_id: userId },
        include: {
            messages: {
                where: {
                    role: { in: ["user", "assistant"] },
                },
                orderBy: { created_at: "asc" },
                select: {
                    id: true,
                    role: true,
                    content: true,
                    created_at: true,
                },
            },
        },
    });

    if (!conversation) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
        id: conversation.id,
        title: conversation.title,
        messages: conversation.messages.map(m => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            createdAt: m.created_at.toISOString(),
        })),
    });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;
        const deleted = await prisma.conversation.deleteMany({
            where: {
                id,
                user_id: userId,
            },
        });

        if (deleted.count === 0) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error("Conversation delete error:", error);
        return NextResponse.json(
            { error: "Nie udało się usunąć rozmowy." },
            { status: 500 },
        );
    }
}
