import { getAthlete } from "@/lib/api/strava";
import { getAuthenticatedUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function shouldSuggestStravaReconnect(cookieStore: Awaited<ReturnType<typeof cookies>>) {
    if (cookieStore.get("strava_manual_disconnect")?.value === "1") {
        return false;
    }

    const userId = await getAuthenticatedUserId();
    if (!userId) {
        return false;
    }

    const [user, linkedActivity] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { strava_user_id: true },
        }),
        prisma.activity.findFirst({
            where: { user_id: userId, strava_activity_id: { not: null } },
            select: { id: true },
        }),
    ]);

    return Boolean(user?.strava_user_id ?? linkedActivity);
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("strava_access_token")?.value;
        const refreshToken = cookieStore.get("strava_refresh_token")?.value;

        // If no tokens exist, user is not authenticated
        if (!accessToken || !refreshToken) {
            const suggestStravaReconnect = await shouldSuggestStravaReconnect(cookieStore);

            return NextResponse.json({ isAuthenticated: false, suggestStravaReconnect });
        }

        // Try to fetch athlete data to validate token
        try {
            await getAthlete(accessToken, refreshToken);

            return NextResponse.json({ isAuthenticated: true, suggestStravaReconnect: false });
        } catch (error) {
            // Token validation failed (expired or invalid)
            console.error("Token validation failed:", error);

            // Clear invalid cookies
            const suggestStravaReconnect = await shouldSuggestStravaReconnect(cookieStore);
            const response = NextResponse.json({ isAuthenticated: false, suggestStravaReconnect });
            response.cookies.delete("strava_access_token");
            response.cookies.delete("strava_refresh_token");

            return response;
        }
    } catch (error) {
        console.error("Error checking auth status:", error);

        return NextResponse.json({ isAuthenticated: false, suggestStravaReconnect: false }, { status: 500 });
    }
}
