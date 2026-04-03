import { getHammerheadConfigFromEnv } from "@/env/env-server";
import { downloadHammerheadFitFile } from "@/lib/api/hammerhead";
import { getAuthenticatedUser } from "@/lib/auth";
import { setHammerheadTokenCookies } from "@/lib/hammerhead-cookies";
import { processFitForActivity } from "@/lib/process-fit-for-activity";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type Body = {
    training_id: string;
};

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const config = getHammerheadConfigFromEnv();
    if (!config) {
        return NextResponse.json({ error: "Hammerhead nie jest skonfigurowany" }, { status: 503 });
    }

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

    const user = await getAuthenticatedUser({
        id: true,
        settings: {
            select: {
                heart_rate_zone_1_max: true,
                heart_rate_zone_2_max: true,
                heart_rate_zone_3_max: true,
                heart_rate_zone_4_max: true,
                heart_rate_zone_5_max: true,
            },
        },
    });

    if (!user?.settings) {
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

    if (activity.fit_processed) {
        return NextResponse.json({ error: "Plik FIT jest już przetworzony dla tej aktywności" }, { status: 409 });
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
            { error: "Ten plik Hammerhead jest już przypisany do innej aktywności" },
            { status: 409 },
        );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("hammerhead_access_token")?.value;
    const refreshToken = cookieStore.get("hammerhead_refresh_token")?.value;

    if (!accessToken || !refreshToken) {
        return NextResponse.json({ error: "Brak sesji Hammerhead" }, { status: 401 });
    }

    try {
        const { buffer, refreshedTokens } = await downloadHammerheadFitFile(
            hammerheadActivityId,
            accessToken,
            refreshToken,
        );
        const nodeBuffer = Buffer.from(buffer);

        const summary = await processFitForActivity(user.settings, {
            trainingId,
            buffer: nodeBuffer,
            hammerheadActivityId,
        });

        const res = NextResponse.json({
            success: true,
            message: "FIT z Hammerhead został zaimportowany",
            data: summary,
        });
        if (refreshedTokens) {
            setHammerheadTokenCookies(res, refreshedTokens);
        }
        return res;
    } catch (error) {
        console.error("Hammerhead FIT import error:", error);

        return NextResponse.json({ error: "Nie udało się pobrać lub przetworzyć pliku FIT" }, { status: 502 });
    }
}
