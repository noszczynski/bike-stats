import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import dayjs from 'dayjs';
import { Prisma } from '@prisma/client';
import { round } from 'lodash';

// Configuration constants for stop detection
const STOP_DETECTION_CONFIG = {
    // Time thresholds
    SPARSE_MEASUREMENT_MAX_GAP_SECONDS: 5,      // Gaps <= 5s are considered sparse measurements
    DEFINITE_STOP_MIN_GAP_SECONDS: 20,         // Gaps >= 20s are definitely stops
    
    // Speed thresholds
    STOP_SPEED_THRESHOLD_MS: 1.66,              // Speed < 1.66 m/s (6 km/h) considered stationary
    GPS_STOP_SPEED_THRESHOLD_KMH: 6,           // GPS average speed < 6 km/h considered stop
    
    // Heart rate thresholds
    HR_DROP_THRESHOLD_BPM: 30,                 // HR drop > 30 bpm might indicate stop
    HR_STABILITY_TIME_THRESHOLD_SECONDS: 60,   // Time window for HR stability check
    
    // Default duration for single measurements
    DEFAULT_MEASUREMENT_DURATION_SECONDS: 1,
    
    // Minimum speed to include HR measurements in zone calculations
    MIN_SPEED_FOR_HR_ZONES_MS: 1.66,          // 6 km/h - exclude HR measurements below this speed
} as const;

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

        const user = await getAuthenticatedUser({
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
                timestamp: true,
                speed_ms: true,
                distance_m: true,
                latitude: true,
                longitude: true
            }
        });

        if (trackpoints.length === 0) {
            return NextResponse.json({ 
                error: 'No trackpoints found for this training' 
            }, { status: 404 });
        }

        const zones = calculateHeartRateZonesByTrackpoints(trackpoints, {
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

export function calculateHeartRateZonesByTrackpoints(trackpoints: Prisma.TrackpointGetPayload<{
    select: {
        heart_rate_bpm: true,
        timestamp: true,
        speed_ms: true,
        distance_m: true,
        latitude: true,
        longitude: true
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

    // Sort all trackpoints by timestamp
    const sortedTrackpoints = trackpoints
        .sort((a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix());

    // Helper function to detect if gap represents a stop vs sparse measurement
    const isLikelyStop = (current: any, next: any, timeDiff: number) => {
        // If gap is very short, it's likely sparse measurement
        if (timeDiff <= STOP_DETECTION_CONFIG.SPARSE_MEASUREMENT_MAX_GAP_SECONDS) return false;
        
        // If gap is very long, it's likely a stop
        if (timeDiff > STOP_DETECTION_CONFIG.DEFINITE_STOP_MIN_GAP_SECONDS) return true;
        
        // Check speed data
        const currentSpeed = current.speed_ms || 0;
        const nextSpeed = next.speed_ms || 0;
        
        // If both speeds are very low, it's likely a stop
        if (currentSpeed < STOP_DETECTION_CONFIG.STOP_SPEED_THRESHOLD_MS && 
            nextSpeed < STOP_DETECTION_CONFIG.STOP_SPEED_THRESHOLD_MS) return true;
        
        // Check GPS coordinates if available
        if (current.latitude && current.longitude && next.latitude && next.longitude) {
            const distanceKm = calculateDistance(
                current.latitude, current.longitude,
                next.latitude, next.longitude
            );
            
            // If distance is very small compared to time gap, it's likely a stop
            const avgSpeed = distanceKm / (timeDiff / 3600); // km/h
            if (avgSpeed < STOP_DETECTION_CONFIG.GPS_STOP_SPEED_THRESHOLD_KMH) return true;
        }
        
        // Check heart rate stability - if HR dropped significantly, might be a stop
        const hrDiff = Math.abs(current.heart_rate_bpm - next.heart_rate_bpm);
        if (hrDiff > STOP_DETECTION_CONFIG.HR_DROP_THRESHOLD_BPM && 
            timeDiff > STOP_DETECTION_CONFIG.HR_STABILITY_TIME_THRESHOLD_SECONDS) return true;
        
        return false;
    };

    // Helper function to calculate distance between two GPS points
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // Find trackpoints with heart rate data and calculate time durations
    for (let i = 0; i < sortedTrackpoints.length; i++) {
        const current = sortedTrackpoints[i];
        
        // Skip if no heart rate data
        if (current.heart_rate_bpm == null) continue;

        // Skip if speed is too low (exclude slow/stationary measurements)
        const currentSpeed = current.speed_ms || 0;
        if (currentSpeed < STOP_DETECTION_CONFIG.MIN_SPEED_FOR_HR_ZONES_MS) continue;

        const hr = current.heart_rate_bpm;
        
        // Calculate duration this heart rate reading should represent
        let duration: number = STOP_DETECTION_CONFIG.DEFAULT_MEASUREMENT_DURATION_SECONDS;
        
        // Look for the next trackpoint with heart rate data that meets speed criteria
        let nextHRIndex = i + 1;
        while (nextHRIndex < sortedTrackpoints.length && 
               (sortedTrackpoints[nextHRIndex].heart_rate_bpm == null ||
                (sortedTrackpoints[nextHRIndex].speed_ms || 0) < STOP_DETECTION_CONFIG.MIN_SPEED_FOR_HR_ZONES_MS)) {
            nextHRIndex++;
        }
        
        if (nextHRIndex < sortedTrackpoints.length) {
            const nextHR = sortedTrackpoints[nextHRIndex];
            const timeDiff = dayjs(nextHR.timestamp).diff(dayjs(current.timestamp), 'seconds');
            
            // Check if the gap represents a stop
            if (isLikelyStop(current, nextHR, timeDiff)) {
                // For stops, only count the current reading time (assume 1 second)
                duration = STOP_DETECTION_CONFIG.DEFAULT_MEASUREMENT_DURATION_SECONDS;
            } else {
                // For sparse measurements, use the full time gap
                duration = Math.max(STOP_DETECTION_CONFIG.DEFAULT_MEASUREMENT_DURATION_SECONDS, timeDiff);
            }
        } else {
            // This is the last valid HR reading, look backward
            let prevHRIndex = i - 1;
            while (prevHRIndex >= 0 && 
                   (sortedTrackpoints[prevHRIndex].heart_rate_bpm == null ||
                    (sortedTrackpoints[prevHRIndex].speed_ms || 0) < STOP_DETECTION_CONFIG.MIN_SPEED_FOR_HR_ZONES_MS)) {
                prevHRIndex--;
            }
            
            if (prevHRIndex >= 0) {
                const prevHR = sortedTrackpoints[prevHRIndex];
                const timeDiff = dayjs(current.timestamp).diff(dayjs(prevHR.timestamp), 'seconds');
                
                if (isLikelyStop(prevHR, current, timeDiff)) {
                    duration = STOP_DETECTION_CONFIG.DEFAULT_MEASUREMENT_DURATION_SECONDS;
                } else {
                    duration = Math.max(STOP_DETECTION_CONFIG.DEFAULT_MEASUREMENT_DURATION_SECONDS, timeDiff);
                }
            }
        }

        // Add duration to appropriate zone
        if (hr < settings.heart_rate_zone_1_max) {
            zoneTimes.zone_1 += duration;
        } else if (hr >= settings.heart_rate_zone_1_max && hr <= settings.heart_rate_zone_2_max) {
            zoneTimes.zone_2 += duration;
        } else if (hr > settings.heart_rate_zone_2_max && hr <= settings.heart_rate_zone_3_max) {
            zoneTimes.zone_3 += duration;
        } else if (hr > settings.heart_rate_zone_3_max && hr <= settings.heart_rate_zone_4_max) {
            zoneTimes.zone_4 += duration;
        } else if (hr > settings.heart_rate_zone_4_max) {
            zoneTimes.zone_5 += duration;
        }
    }

    // Calculate total time with heart rate data
    const totalHRTime = Object.values(zoneTimes).reduce((sum, time) => sum + time, 0);

    // Convert seconds to HH:MM:SS format
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return {
        zone_1: {time: formatTime(zoneTimes.zone_1), percentage: round((zoneTimes.zone_1 / totalHRTime) * 100, 1)},
        zone_2: {time: formatTime(zoneTimes.zone_2), percentage: round((zoneTimes.zone_2 / totalHRTime) * 100, 1)},
        zone_3: {time: formatTime(zoneTimes.zone_3), percentage: round((zoneTimes.zone_3 / totalHRTime) * 100, 1)},
        zone_4: {time: formatTime(zoneTimes.zone_4), percentage: round((zoneTimes.zone_4 / totalHRTime) * 100, 1)},
        zone_5: {time: formatTime(zoneTimes.zone_5), percentage: round((zoneTimes.zone_5 / totalHRTime) * 100, 1)}
    };
} 