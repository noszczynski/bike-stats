import { serverEnv } from '@/env/env-server';
import { StravaActivity, StravaAuthResponse, StravaTokens } from '@/types/strava';

const STRAVA_CLIENT_ID = serverEnv.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = serverEnv.STRAVA_CLIENT_SECRET;

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

async function handleStravaRequest<T>(
    accessToken: string,
    refreshToken: string | undefined,
    request: (token: string) => Promise<T>
): Promise<T> {
    try {
        return await request(accessToken);
    } catch (error) {
        if (!refreshToken) {
            throw error;
        }

        // Try to refresh the token
        try {
            const newTokens = await refreshStravaToken(refreshToken);

            // Update cookies with new tokens
            const response = await fetch('/api/auth/strava/refresh-tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTokens)
            });

            if (!response.ok) {
                throw new Error('Failed to update tokens');
            }

            // Retry the request with new access token
            return await request(newTokens.access_token);
        } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
            throw refreshError;
        }
    }
}

export async function getAthlete(accessToken: string, refreshToken?: string) {
    return handleStravaRequest(accessToken, refreshToken, async (token) => {
        const response = await fetch('https://www.strava.com/api/v3/athlete', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch athlete data');
        }

        return response.json();
    });
}

export async function getAllStravaRideActivities(
    accessToken: string,
    refreshToken?: string,
    params?: {
        before?: number;
        after?: number;
        page?: number;
        per_page?: number;
    }
) {
    return handleStravaRequest(accessToken, refreshToken, async (token) => {
        const queryParams = new URLSearchParams();

        if (params?.before) queryParams.append('before', params.before.toString());
        if (params?.after) queryParams.append('after', params.after.toString());

        queryParams.append('page', (params?.page ?? 1).toString());
        queryParams.append('per_page', (params?.per_page ?? 100).toString());

        const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return [];
        }

        const json = await (response.json() as Promise<StravaActivity[]>);

        return json.filter((activity) => activity.sport_type === 'Ride');
    });
}

/**
 * Get a specific activity by ID from Strava
 */
export async function getActivity(activityId: number, accessToken: string, refreshToken?: string) {
    return handleStravaRequest(accessToken, refreshToken, async (token) => {
        const response = await fetch(
            `https://www.strava.com/api/v3/activities/${activityId}?include_all_efforts=false`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch activity ${activityId}`);
        }

        return response.json();
    });
}
