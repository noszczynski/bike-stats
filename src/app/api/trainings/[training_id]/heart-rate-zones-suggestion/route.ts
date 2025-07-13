import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';

type TrackpointData = {
    id: string;
    timestamp: string;
    heart_rate_bpm?: number;
};

type CalculatedZones = {
    zone_1: string;
    zone_2: string;
    zone_3: string;
    zone_4: string;
    zone_5: string;
};

export async function GET(
    request: NextRequest,
    { params }: { params: { training_id: string } }
) {
    try {
        const trainingId = params.training_id;

        // Get trackpoints for the training
        const trackpoints = await prisma.trackpoint.findMany({
            where: { activity_id: trainingId },
            orderBy: { timestamp: 'asc' }
        });

        if (trackpoints.length === 0) {
            return NextResponse.json({ 
                error: 'No trackpoints found for this training' 
            }, { status: 404 });
        }

        // Calculate heart rate zones
        const zones = calculateHeartRateZones(trackpoints);

        return NextResponse.json({
            zones,
            trackpointsCount: trackpoints.length
        });
    } catch (error) {
        console.error('Error in heart rate zones suggestion endpoint:', error);
        
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function calculateHeartRateZones(trackpoints: any[]): CalculatedZones {
    const zoneTimes = {
        zone_1: 0,
        zone_2: 0,
        zone_3: 0,
        zone_4: 0,
        zone_5: 0
    };

    // Filter trackpoints with heart rate data and sort by timestamp
    const heartRateTrackpoints = trackpoints
        .filter(tp => tp.heart_rate_bpm != null)
        .sort((a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix());

    // Calculate time spent in each zone
    for (let i = 0; i < heartRateTrackpoints.length - 1; i++) {
        const current = heartRateTrackpoints[i];
        const next = heartRateTrackpoints[i + 1];
        
        const currentTime = dayjs(current.timestamp);
        const nextTime = dayjs(next.timestamp);
        const timeDiff = nextTime.diff(currentTime, 'second'); // seconds
        
        const hr = current.heart_rate_bpm!;
        
        if (hr < 113) {
            zoneTimes.zone_1 += timeDiff;
        } else if (hr >= 113 && hr <= 132) {
            zoneTimes.zone_2 += timeDiff;
        } else if (hr > 132 && hr <= 151) {
            zoneTimes.zone_3 += timeDiff;
        } else if (hr > 151 && hr <= 170) {
            zoneTimes.zone_4 += timeDiff;
        } else if (hr > 170) {
            zoneTimes.zone_5 += timeDiff;
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
        zone_1: formatTime(zoneTimes.zone_1),
        zone_2: formatTime(zoneTimes.zone_2),
        zone_3: formatTime(zoneTimes.zone_3),
        zone_4: formatTime(zoneTimes.zone_4),
        zone_5: formatTime(zoneTimes.zone_5)
    };
} 