import { updateTrainings as updateTrainingsDb } from "@/lib/api/trainings";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("strava_access_token")?.value;
        const refreshToken = cookieStore.get("strava_refresh_token")?.value;

        if (!accessToken || !refreshToken) {
            return NextResponse.json(
                { error: "No access token or refresh token found" },
                { status: 401 },
            );
        }

        const result = await updateTrainingsDb(accessToken, refreshToken);

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error("Error updating trainings:", error);

        return NextResponse.json({ error: "Failed to update trainings" }, { status: 500 });
    }
}
