import { getHammerheadConfigFromEnv } from "@/env/env-server";
import { buildHammerheadAuthorizeUrl } from "@/lib/api/hammerhead";
import { createHammerheadOAuthState } from "@/lib/hammerhead-oauth-state";
import { NextResponse } from "next/server";

export async function GET() {
    const config = getHammerheadConfigFromEnv();
    if (!config) {
        return NextResponse.json({ error: "Hammerhead API is not configured on the server" }, { status: 503 });
    }

    const state = createHammerheadOAuthState();
    const authUrl = buildHammerheadAuthorizeUrl({ state });
    const response = NextResponse.redirect(authUrl);

    response.cookies.set("hammerhead_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 15,
    });

    return response;
}
