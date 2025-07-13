import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import dayjs from 'dayjs';
import { Prisma } from '@prisma/client';
import { round } from 'lodash';

type TrackpointData = {
    id: string;
    timestamp: string;
    heart_rate_bpm?: number;
};

type CalculatedZones = {
    zone_1: {time: string, percentage: number};
    zone_2: {time: string, percentage: number};
    zone_3: {time: string, percentage: number};
    zone_4: {time: string, percentage: number};
    zone_5: {time: string, percentage: number};
};

export async function GET(
    request: NextRequest,
    { params }: { params: { training_id: string } }
) {
    try {
        const trainingId = params.training_id;

        // Get user from JWT token
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'No authentication token found' }, { status: 401 });
        }

        // Verify JWT token
        let decoded;
        try {
            decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
        } catch (error) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { 
                id: decoded.userId
            },
            select: {
                id: true,
                email: true,
                settings: {
                    select: {
                        heart_rate_zone_1_max: true,
                        heart_rate_zone_2_max: true,
                        heart_rate_zone_3_max: true,
                        heart_rate_zone_4_max: true,
                        heart_rate_zone_5_max: true,
                    }
                }
            }
        });

        if (!user || !user.settings) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const activity = await prisma.activity.findUnique({
            where: {
                id: trainingId,
                user_id: user.id
            },
            select: {
                id: true,
            }
        });

        if (!activity) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }

        const trackpoints = await prisma.trackpoint.findMany({
            where: { 
                activity_id: activity.id,
                heart_rate_bpm: {
                    not: null
                }
            },
            orderBy: {
                timestamp: 'asc' },
            select: {
                heart_rate_bpm: true,
                timestamp: true
            }
        });

        if (trackpoints.length === 0) {
            return NextResponse.json({ 
                error: 'No trackpoints found for this training' 
            }, { status: 404 });
        }

        // Calculate heart rate zones
        const zones = calculateHeartRateZones(trackpoints, {
            heart_rate_zone_1_min: 0,
            heart_rate_zone_1_max: user.settings.heart_rate_zone_1_max ?? 0,

            heart_rate_zone_2_min: (user.settings.heart_rate_zone_1_max ?? 0) + 1,
            heart_rate_zone_2_max: user.settings.heart_rate_zone_2_max ?? 0,

            heart_rate_zone_3_min: (user.settings.heart_rate_zone_2_max ?? 0) + 1,
            heart_rate_zone_3_max: user.settings.heart_rate_zone_3_max ?? 0,

            heart_rate_zone_4_min: (user.settings.heart_rate_zone_3_max ?? 0) + 1,
            heart_rate_zone_4_max: user.settings.heart_rate_zone_4_max ?? 0,

            heart_rate_zone_5_min: (user.settings.heart_rate_zone_4_max ?? 0) + 1,
            heart_rate_zone_5_max: 300,
        });

        return NextResponse.json({
            zones,
            trackpointsCount: trackpoints.length
        });
    } catch (error) {
        console.error('Error in heart rate zones suggestion endpoint:', error);
        
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function calculateHeartRateZones(trackpoints: Prisma.TrackpointGetPayload<{
    select: {
        heart_rate_bpm: true,
        timestamp: true
    }
}>[], settings: {
    heart_rate_zone_1_min: number,
    heart_rate_zone_1_max: number,
    heart_rate_zone_2_min: number,
    heart_rate_zone_2_max: number,
    heart_rate_zone_3_min: number,
    heart_rate_zone_3_max: number,
    heart_rate_zone_4_min: number,
    heart_rate_zone_4_max: number,
    heart_rate_zone_5_min: number,
    heart_rate_zone_5_max: number
}): CalculatedZones {
    const zoneTimes = {
        zone_1: 0,
        zone_2: 0,
        zone_3: 0,
        zone_4: 0,
        zone_5: 0
    };

    console.log("trackpoints:", trackpoints);

    // Filter trackpoints with heart rate data and sort by timestamp
    const heartRateTrackpoints = trackpoints
        .filter(tp => tp.heart_rate_bpm != null)
        .sort((a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix());

    // Calculate time spent in each zone
    for (let i = 0; i < heartRateTrackpoints.length - 1; i++) {
        const current = heartRateTrackpoints[i];
        const hr = current.heart_rate_bpm!;

        if (hr < settings.heart_rate_zone_1_max) {
            zoneTimes.zone_1 += 1;
        } else if (hr >= settings.heart_rate_zone_1_max && hr <= settings.heart_rate_zone_2_max) {
            zoneTimes.zone_2 += 1;
        } else if (hr > settings.heart_rate_zone_2_max && hr <= settings.heart_rate_zone_3_max) {
            zoneTimes.zone_3 += 1;
        } else if (hr > settings.heart_rate_zone_3_max && hr <= settings.heart_rate_zone_4_max) {
            zoneTimes.zone_4 += 1;
        } else if (hr > settings.heart_rate_zone_4_max) {
            zoneTimes.zone_5 += 1;
        }
    }

    // Convert seconds to HH:MM:SS format
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return {
        zone_1: {time: formatTime(zoneTimes.zone_1), percentage: round((zoneTimes.zone_1 / trackpoints.length) * 100, 1)},
        zone_2: {time: formatTime(zoneTimes.zone_2), percentage: round((zoneTimes.zone_2 / trackpoints.length) * 100, 1)},
        zone_3: {time: formatTime(zoneTimes.zone_3), percentage: round((zoneTimes.zone_3 / trackpoints.length) * 100, 1)},
        zone_4: {time: formatTime(zoneTimes.zone_4), percentage: round((zoneTimes.zone_4 / trackpoints.length) * 100, 1)},
        zone_5: {time: formatTime(zoneTimes.zone_5), percentage: round((zoneTimes.zone_5 / trackpoints.length) * 100, 1)}
    };
} 