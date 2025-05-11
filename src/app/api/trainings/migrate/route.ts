import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('strava_access_token')?.value;
        const refreshToken = cookieStore.get('strava_refresh_token')?.value;

        if (!accessToken || !refreshToken) {
            return NextResponse.json({ error: 'No access token or refresh token found' }, { status: 401 });
        }

        // place actions here

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error:', error);

        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}
