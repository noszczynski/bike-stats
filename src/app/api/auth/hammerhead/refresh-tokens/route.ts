import { setHammerheadTokenCookies } from "@/lib/hammerhead-cookies";
import type { HammerheadTokens } from "@/types/hammerhead";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const newTokens = (await request.json()) as HammerheadTokens;
        const response = NextResponse.json({ success: true });

        setHammerheadTokenCookies(response, {
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token,
        });

        return response;
    } catch (error) {
        console.error("Error updating Hammerhead tokens:", error);

        return NextResponse.json({ error: "Failed to update tokens" }, { status: 500 });
    }
}
