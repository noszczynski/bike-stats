import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const user = await getAuthenticatedUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tags = await prisma.tag.findMany({
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json(tags);
    } catch (error) {
        console.error("Error fetching tags:", error);
        return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, color, icon } = body;

        if (!name) {
            return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
        }

        const existingTag = await prisma.tag.findUnique({
            where: { name },
        });

        if (existingTag) {
            return NextResponse.json(
                { error: "Tag with this name already exists" },
                { status: 409 },
            );
        }

        const tag = await prisma.tag.create({
            data: {
                name,
                description,
                color: color || "#6b7280",
                icon: icon || "tag",
            },
        });

        return NextResponse.json(tag, { status: 201 });
    } catch (error) {
        console.error("Error creating tag:", error);
        return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
    }
}
