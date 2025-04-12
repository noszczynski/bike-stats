import { NextResponse } from 'next/server';

import { serverEnv, validateEnv } from '@/env/env-server';

export async function GET() {
    const env = validateEnv();
    const stravaAuthUrl = new URL('https://www.strava.com/oauth/authorize');

    stravaAuthUrl.searchParams.append('client_id', env.STRAVA_CLIENT_ID.toString());
    stravaAuthUrl.searchParams.append('response_type', 'code');
    stravaAuthUrl.searchParams.append('redirect_uri', env.STRAVA_AUTH_CALLBACK_URI);
    stravaAuthUrl.searchParams.append('scope', 'activity:read_all');

    return NextResponse.redirect(stravaAuthUrl.toString());
}
