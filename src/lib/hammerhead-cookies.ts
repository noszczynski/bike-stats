import type { NextResponse } from "next/server";

const ACCESS_COOKIE = "hammerhead_access_token";
const REFRESH_COOKIE = "hammerhead_refresh_token";

export function setHammerheadTokenCookies(
    response: NextResponse,
    tokens: { access_token: string; refresh_token?: string },
) {
    response.cookies.set(ACCESS_COOKIE, tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
    });
    if (tokens.refresh_token) {
        response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30,
        });
    }
}

export function clearHammerheadCookies(response: NextResponse) {
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
}
