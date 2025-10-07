import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAthlete } from '@/lib/api/strava';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('strava_access_token')?.value;
        const refreshToken = cookieStore.get('strava_refresh_token')?.value;

        if (!accessToken) {
            return NextResponse.json({ error: 'No access token found' }, { status: 401 });
        }

        const athlete = await getAthlete(accessToken, refreshToken);
        
return NextResponse.json(athlete);
    } catch (error) {
        console.error('Error fetching athlete data:', error);
        
return NextResponse.json({ error: 'Failed to fetch athlete data' }, { status: 500 });
    }
} 