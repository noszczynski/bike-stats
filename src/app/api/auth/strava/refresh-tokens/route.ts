import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { StravaTokens } from '@/types/strava';

export async function POST(request: Request) {
    try {
        const newTokens: StravaTokens = await request.json();
        const response = NextResponse.json({ success: true });

        // Update cookies with new tokens
        response.cookies.set('strava_access_token', newTokens.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        response.cookies.set('strava_refresh_token', newTokens.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });

        return response;
    } catch (error) {
        console.error('Error updating tokens:', error);

        return NextResponse.json({ error: 'Failed to update tokens' }, { status: 500 });
    }
}
