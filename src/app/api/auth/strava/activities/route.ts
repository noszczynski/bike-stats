import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getAllStravaRideActivities } from '@/lib/api/strava';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('strava_access_token')?.value;
        const refreshToken = cookieStore.get('strava_refresh_token')?.value;

        if (!accessToken) {
            return NextResponse.json({ error: 'No access token found' }, { status: 401 });
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const params = {
            before: searchParams.get('before') ? parseInt(searchParams.get('before')!) : undefined,
            after: searchParams.get('after') ? parseInt(searchParams.get('after')!) : undefined,
            page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
            per_page: searchParams.get('per_page') ? parseInt(searchParams.get('per_page')!) : 100
        };

        const activities = await getAllStravaRideActivities(accessToken, refreshToken, params);
        
        return NextResponse.json(activities);
    } catch (error) {
        console.error('Error fetching Strava activities:', error);
        
        return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }
} 