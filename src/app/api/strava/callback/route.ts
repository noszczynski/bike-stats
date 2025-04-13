import { NextResponse } from 'next/server';

import { exchangeCodeForToken } from '@/app/api/_lib/strava';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/strava?error=${error}`);
    }

    if (!code) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/strava?error=missing_code`);
    }

    try {
        const tokenData = await exchangeCodeForToken(code);
        const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/profile`);

        // Set cookies in the response
        response.cookies.set('strava_access_token', tokenData.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        response.cookies.set('strava_refresh_token', tokenData.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });

        return response;
    } catch (error) {
        console.error('Error exchanging code for token:', error);

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/strava?error=token_exchange_failed`);
    }
}
