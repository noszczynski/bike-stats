import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';
import { getAthleteRoutes } from '@/lib/api/strava';

export const revalidate = 3600; // 1 hour cache

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('strava_access_token')?.value;
        const refreshToken = cookieStore.get('strava_refresh_token')?.value;
        const athleteId = "122643449";

        if (!accessToken) {
            return NextResponse.json({ error: 'No access token found' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
        const perPage = searchParams.get('per_page') ? parseInt(searchParams.get('per_page')!) : 100;

        const routes = await getAthleteRoutes(athleteId, accessToken, refreshToken, {
            page,
            per_page: perPage
        });

        return NextResponse.json(routes.map(route => ({...route, id: route.id_str})));
    } catch (error) {
        console.error('Error fetching routes:', error);
        return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
    }
}

