import { exchangeCodeForToken } from "@/lib/api/hammerhead";
import { setHammerheadTokenCookies } from "@/lib/hammerhead-cookies";
import { isValidHammerheadOAuthState } from "@/lib/hammerhead-oauth-state";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";

    if (error) {
        return NextResponse.redirect(
            `${baseUrl}/auth/hammerhead?error=${encodeURIComponent(error)}`,
        );
    }

    if (!code || !state) {
        return NextResponse.redirect(`${baseUrl}/auth/hammerhead?error=missing_code_or_state`);
    }

    if (!isValidHammerheadOAuthState(state)) {
        return NextResponse.redirect(`${baseUrl}/auth/hammerhead?error=invalid_state`);
    }

    const cookieStore = await cookies();
    const expectedState = cookieStore.get("hammerhead_oauth_state")?.value;
    if (!isValidHammerheadOAuthState(expectedState) || expectedState !== state) {
        return NextResponse.redirect(`${baseUrl}/auth/hammerhead?error=invalid_state`);
    }

    try {
        const tokenData = await exchangeCodeForToken(code);
        const response = NextResponse.redirect(`${baseUrl}/auth/hammerhead?connected=1`);

        response.cookies.delete("hammerhead_oauth_state");
        setHammerheadTokenCookies(response, {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
        });

        return response;
    } catch (e) {
        console.error("Hammerhead token exchange error:", e);

        return NextResponse.redirect(`${baseUrl}/auth/hammerhead?error=token_exchange_failed`);
    }
}
