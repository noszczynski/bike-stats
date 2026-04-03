import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("hammerhead_access_token")?.value;

        return NextResponse.json({ isAuthenticated: !!accessToken });
    } catch (error) {
        console.error("Error checking Hammerhead auth:", error);

        return NextResponse.json({ isAuthenticated: false }, { status: 500 });
    }
}
