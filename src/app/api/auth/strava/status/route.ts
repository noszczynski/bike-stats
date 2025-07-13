import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAthlete } from '@/lib/api/strava';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('strava_access_token')?.value;
        const refreshToken = cookieStore.get('strava_refresh_token')?.value;

        // If no tokens exist, user is not authenticated
        if (!accessToken || !refreshToken) {
            return NextResponse.json({ isAuthenticated: false });
        }

        // Try to fetch athlete data to validate token
        try {
            await getAthlete(accessToken, refreshToken);
            
return NextResponse.json({ isAuthenticated: true });
        } catch (error) {
            // Token validation failed (expired or invalid)
            console.error('Token validation failed:', error);
            
            // Clear invalid cookies
            const response = NextResponse.json({ isAuthenticated: false });
            response.cookies.delete('strava_access_token');
            response.cookies.delete('strava_refresh_token');
            
            return response;
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        
return NextResponse.json({ isAuthenticated: false }, { status: 500 });
    }
} 