import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Body = {
    training_id: string;
};

/**
 * Powiązanie istniejącego, przetworzonego treningu z id aktywności Hammerhead (bez ponownego importu .fit).
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id: hammerheadActivityId } = await params;

    let body: Body;
    try {
        body = (await request.json()) as Body;
    } catch {
        return NextResponse.json({ error: "Nieprawidłowe body żądania" }, { status: 400 });
    }

    const trainingId = body.training_id;
    if (!trainingId) {
        return NextResponse.json({ error: "Wymagane training_id" }, { status: 400 });
    }

    const user = await getAuthenticatedUser({ id: true });
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activity = await prisma.activity.findFirst({
        where: { id: trainingId, user_id: user.id },
        select: {
            id: true,
            fit_processed: true,
            hammerhead_activity_id: true,
        },
    });

    if (!activity) {
        return NextResponse.json({ error: "Aktywność nie znaleziona" }, { status: 404 });
    }

    if (!activity.fit_processed) {
        return NextResponse.json(
            {
                error:
                    "Powiązanie bez importu jest możliwe tylko dla treningów z już przetworzonym plikiem FIT. Użyj importu z Hammerhead.",
            },
            { status: 400 },
        );
    }

    const duplicate = await prisma.activity.findFirst({
        where: {
            hammerhead_activity_id: hammerheadActivityId,
            NOT: { id: trainingId },
        },
        select: { id: true },
    });

    if (duplicate) {
        return NextResponse.json(
            { error: "Ta aktywność Hammerhead jest już przypisana do innego treningu" },
            { status: 409 },
        );
    }

    if (activity.hammerhead_activity_id === hammerheadActivityId) {
        return NextResponse.json({
            success: true,
            message: "Powiązanie bez zmian",
            hammerhead_activity_id: hammerheadActivityId,
        });
    }

    await prisma.activity.update({
        where: { id: trainingId },
        data: { hammerhead_activity_id: hammerheadActivityId },
    });

    return NextResponse.json({
        success: true,
        message: "Powiązano trening z aktywnością Hammerhead",
        hammerhead_activity_id: hammerheadActivityId,
    });
}
