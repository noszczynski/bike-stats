import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ success: true });

    // Remove Strava-related cookies
    response.cookies.delete("strava_access_token");
    response.cookies.delete("strava_refresh_token");

    response.cookies.set("strava_manual_disconnect", "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
    });

    return response;
}
