import { getHammerheadConfigFromEnv } from "@/env/env-server";
import {
    fetchHammerheadActivities,
    normalizeHammerheadActivitiesPayload,
} from "@/lib/api/hammerhead";
import { setHammerheadTokenCookies } from "@/lib/hammerhead-cookies";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const config = getHammerheadConfigFromEnv();
    if (!config) {
        return NextResponse.json({ error: "Hammerhead nie jest skonfigurowany" }, { status: 503 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("hammerhead_access_token")?.value;
    const refreshToken = cookieStore.get("hammerhead_refresh_token")?.value;

    if (!accessToken || !refreshToken) {
        return NextResponse.json({ error: "Brak sesji Hammerhead" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") ?? "1";
    const perPage = searchParams.get("per_page") ?? "50";

    try {
        const { data, refreshedTokens } = await fetchHammerheadActivities(accessToken, refreshToken, {
            page,
            per_page: perPage,
        });
        const activities = normalizeHammerheadActivitiesPayload(data);
        const res = NextResponse.json({ activities });
        if (refreshedTokens) {
            setHammerheadTokenCookies(res, refreshedTokens);
        }
        return res;
    } catch (error) {
        console.error("Hammerhead activities list error:", error);

        return NextResponse.json({ error: "Nie udało się pobrać aktywności Hammerhead" }, { status: 502 });
    }
}
