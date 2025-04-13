import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { importActivity } from '@/lib/api/trainings';

import { z } from 'zod';

const importSchema = z.object({
    strava_activity_id: z.number(),
    heart_rate_zones: z
        .object({
            zone_1: z.string().regex(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/),
            zone_2: z.string().regex(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/),
            zone_3: z.string().regex(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/),
            zone_4: z.string().regex(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/),
            zone_5: z.string().regex(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)
        })
        .optional(),
    summary: z.string().optional(),
    device: z.string().optional(),
    battery_percent_usage: z.number().min(0).max(100).optional(),
    effort: z.number().min(1).max(10).optional()
});

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('strava_access_token')?.value;
        const refreshToken = cookieStore.get('strava_refresh_token')?.value;

        if (!accessToken || !refreshToken) {
            return NextResponse.json({ error: 'No access token or refresh token found' }, { status: 401 });
        }

        const body = await request.json();
        const data = importSchema.parse(body);

        const activity = await importActivity(data.strava_activity_id, {
            heart_rate_zones: data.heart_rate_zones,
            summary: data.summary,
            device: data.device,
            battery_percent_usage: data.battery_percent_usage,
            effort: data.effort
        });

        return NextResponse.json({ activity }, { status: 201 });
    } catch (error) {
        console.error('Import error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
