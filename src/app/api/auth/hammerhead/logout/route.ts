import { clearHammerheadCookies } from "@/lib/hammerhead-cookies";
import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ success: true });
    clearHammerheadCookies(response);

    return response;
}
