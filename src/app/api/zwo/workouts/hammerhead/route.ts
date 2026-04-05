import { getHammerheadConfigFromEnv } from "@/env/env-server";
import { uploadHammerheadWorkoutFile } from "@/lib/api/hammerhead";
import { getAuthenticatedUserId } from "@/lib/auth";
import { setHammerheadTokenCookies } from "@/lib/hammerhead-cookies";
import { toZwoXml } from "@/lib/zwo/to-zwo-xml";
import { zwoWorkoutSchema } from "@/lib/zwo/types";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

function toSafeWorkoutFilename(workoutName: string): string {
    const safeName = workoutName
        .toLowerCase()
        .trim()
        .replaceAll(/\s+/g, "-")
        .replaceAll(/[^a-z0-9-_]/g, "");

    return `${safeName || "training"}.zwo`;
}

export async function POST(request: NextRequest) {
    const config = getHammerheadConfigFromEnv();
    if (!config) {
        return NextResponse.json({ error: "Hammerhead nie jest skonfigurowany" }, { status: 503 });
    }

    const userId = await getAuthenticatedUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("hammerhead_access_token")?.value;
    const refreshToken = cookieStore.get("hammerhead_refresh_token")?.value;

    if (!accessToken || !refreshToken) {
        return NextResponse.json({ error: "Brak sesji Hammerhead" }, { status: 401 });
    }

    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ error: "Nieprawidłowe body żądania" }, { status: 400 });
    }

    const workoutData = zwoWorkoutSchema.safeParse(
        typeof payload === "object" && payload !== null && "workout" in payload
            ? payload.workout
            : payload,
    );

    if (!workoutData.success) {
        return NextResponse.json(
            { error: "Nieprawidłowy trening", details: workoutData.error.flatten() },
            { status: 400 },
        );
    }

    const xml = toZwoXml(workoutData.data);
    const fileName = toSafeWorkoutFilename(workoutData.data.name);
    const file = new File([xml], fileName, {
        type: "application/xml",
    });

    try {
        const { data, refreshedTokens } = await uploadHammerheadWorkoutFile(
            file,
            accessToken,
            refreshToken,
        );

        const response = NextResponse.json({
            success: true,
            workoutId: data.id,
            name: data.name,
            plannedDate: data.plannedDate,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });

        if (refreshedTokens) {
            setHammerheadTokenCookies(response, refreshedTokens);
        }

        return response;
    } catch (error) {
        console.error("Hammerhead workout upload error:", error);
        return NextResponse.json(
            { error: "Nie udało się wysłać treningu do Hammerhead." },
            { status: 502 },
        );
    }
}
