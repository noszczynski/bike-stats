import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getAllStravaRideActivities } from '@/lib/api/strava';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('strava_access_token')?.value;
        const refreshToken = cookieStore.get('strava_refresh_token')?.value;

        if (!accessToken || !refreshToken) {
            return NextResponse.json({ error: 'No access token or refresh token found' }, { status: 401 });
        }

        const sa = await getAllStravaRideActivities(accessToken, refreshToken);

        console.log(JSON.stringify(sa, null, 2));

        await prisma.$transaction(async (tx) => {
            for (const activity of sa) {
                await tx.stravaActivity.update({
                    where: {
                        id: activity.id
                    },
                    data: {
                        map_summary_polyline:
                            typeof activity.map.summary_polyline === 'string'
                                ? activity.map.summary_polyline
                                : undefined,
                        map_summary_id: typeof activity.map.id === 'string' ? activity.map.id : undefined
                    }
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating trainings:', error);

        return NextResponse.json({ error: 'Failed to update trainings' }, { status: 500 });
    }
}
