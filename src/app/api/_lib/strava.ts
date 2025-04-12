import { serverEnv } from '@/env/env-server';
import { StravaAuthResponse, StravaTokens } from '@/types/strava';

const STRAVA_CLIENT_ID = serverEnv.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = serverEnv.STRAVA_CLIENT_SECRET;
const STRAVA_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/strava/callback`;

export const STRAVA_AUTH_URL = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${STRAVA_REDIRECT_URI}&scope=read,activity:read_all`;

export async function exchangeCodeForToken(code: string): Promise<StravaAuthResponse> {
    const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code'
        })
    });

    if (!response.ok) {
        throw new Error('Failed to exchange code for token');
    }

    return response.json();
}

export async function refreshStravaToken(refreshToken: string): Promise<StravaTokens> {
    const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        })
    });

    if (!response.ok) {
        throw new Error('Failed to refresh token');
    }

    return response.json();
}

export async function getAthlete(accessToken: string) {
    const response = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch athlete data');
    }

    return response.json();
}

export async function getActivities(
    accessToken: string,
    params?: {
        before?: number;
        after?: number;
        page?: number;
        per_page?: number;
    }
) {
    const queryParams = new URLSearchParams();
    if (params?.before) queryParams.append('before', params.before.toString());
    if (params?.after) queryParams.append('after', params.after.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?${queryParams.toString()}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch activities');
    }

    return response.json();
}
