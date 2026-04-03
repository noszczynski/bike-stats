import {
    fetchHammerheadActivities,
    normalizeHammerheadActivitiesPayload,
} from "@/lib/api/hammerhead";
import { clearHammerheadCookies, setHammerheadTokenCookies } from "@/lib/hammerhead-cookies";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("hammerhead_access_token")?.value;
        const refreshToken = cookieStore.get("hammerhead_refresh_token")?.value;

        if (!accessToken || !refreshToken) {
            return NextResponse.json({ isAuthenticated: false });
        }

        try {
            const { data, refreshedTokens } = await fetchHammerheadActivities(
                accessToken,
                refreshToken,
                { per_page: "1" },
            );
            normalizeHammerheadActivitiesPayload(data);
            const res = NextResponse.json({ isAuthenticated: true });
            if (refreshedTokens) {
                setHammerheadTokenCookies(res, refreshedTokens);
            }
            return res;
        } catch (error) {
            console.error("Hammerhead token validation failed:", error);
            const res = NextResponse.json({ isAuthenticated: false });
            clearHammerheadCookies(res);
            return res;
        }
    } catch (error) {
        console.error("Error checking Hammerhead auth:", error);

        return NextResponse.json({ isAuthenticated: false }, { status: 500 });
    }
}
