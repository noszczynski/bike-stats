import { Prisma, ActivityType } from '@prisma/client';
import { Training, TrainingSchema } from '@/types/training';

import { getActivityById, getActivityByStravaId } from '../db';
import { prisma } from '../prisma';
import dayjs from 'dayjs';
import { Decimal } from 'decimal.js';
import { z } from 'zod';
import { meterPerSecondToKmph } from '@/lib/convert/meter-per-second-to-kmph';
import { minutesToTimeString, secondsToTimeString, timeStringToMinutes } from '@/utils/time';
import { getAllStravaRideActivities } from '@/lib/api/strava';

function formatActivityToTraining(activity: Prisma.ActivityGetPayload<{
    include: { strava_activity: true };
}>): Training {
    return {
        id: activity.id,
        strava_activity_id: Number(activity.strava_activity.id),
        name: activity.strava_activity.name,
        date: dayjs(activity.strava_activity.date).format('YYYY-MM-DD'),
        distance_km: activity.strava_activity.distance_m / 1000,
        elevation_gain_m: activity.strava_activity.elevation_gain_m,
        moving_time: secondsToTimeString(activity.strava_activity.moving_time_s),
        avg_speed_kmh: new Decimal(activity.strava_activity.avg_speed_kmh).toNumber(),
        max_speed_kmh: new Decimal(activity.strava_activity.max_speed_kmh).toNumber(),
        avg_heart_rate_bpm: activity.strava_activity.avg_heart_rate_bpm,
        max_heart_rate_bpm: activity.strava_activity.max_heart_rate_bpm,
        heart_rate_zones:
            activity &&
            activity.heart_rate_zone_1 &&
            activity.heart_rate_zone_2 &&
            activity.heart_rate_zone_3 &&
            activity.heart_rate_zone_4 &&
            activity.heart_rate_zone_5
                ? {
                      zone_1: activity.heart_rate_zone_1,
                      zone_2: activity.heart_rate_zone_2,
                      zone_3: activity.heart_rate_zone_3,
                      zone_4: activity.heart_rate_zone_4,
                      zone_5: activity.heart_rate_zone_5
                  }
                : null,
        summary: activity.summary ?? null,
        device: activity.device ?? null,
        battery_percent_usage: activity.battery_percent_usage ?? null,
        effort: activity.effort ?? null
    } satisfies Training;
}

/**
 * Fetch all imported trainings from the database
 */
export async function getAllTrainings(): Promise<Training[]> {
    const importedActivities = await prisma.activity.findMany({
        where: {
            type: ActivityType.ride
        },
        include: {
            strava_activity: true
        },
        orderBy: {
            strava_activity: {
                date: 'desc'
            }
        }
    });

    return z.array(TrainingSchema).parse(importedActivities.map(formatActivityToTraining));
}

export async function getTrainingsToImport(accessToken: string, refreshToken: string) {
    const stravaActivities = await prisma.stravaActivity.findMany({
        orderBy: {
            created_at: 'desc'
        }
    });
    const stravaRides = await getAllStravaRideActivities(accessToken, refreshToken);

    /** Filter out activities that are already imported to database */
    return stravaRides.filter((ride) => !stravaActivities.some((activity) => activity.id === BigInt(ride.id)));
}

export async function updateTrainings(accessToken: string, refreshToken: string) {
    const trainingsToImport = await getTrainingsToImport(accessToken, refreshToken);

    return prisma.$transaction(async tx => {
        for await (const training of trainingsToImport) {
            await tx.stravaActivity.create({
                data: {
                    id: Number(training.id),
                    name: training.name,
                    date: training.start_date,
                    distance_m: Number(training.distance),
                    elevation_gain_m: Number(training.total_elevation_gain),
                    moving_time_s: Number(training.moving_time),
                    avg_speed_kmh: new Decimal(meterPerSecondToKmph(training.average_speed)),
                    max_speed_kmh: new Decimal(meterPerSecondToKmph(training.max_speed * 3.6)),
                    avg_heart_rate_bpm: Number(training.average_heartrate),
                    max_heart_rate_bpm: Number(training.max_heartrate),
                    activity: {
                        create: {
                            type: ActivityType.ride,
                        }
                    }
                }
            })
        }
    })
}

/**
 * Fetch a specific training by ID from Strava API and local database
 */
export async function getTrainingById(
    trainingId: string,
): Promise<Training | null> {
    try {
        // First try to find the imported activity
        const importedActivity = await getActivityById(trainingId);

        if (!importedActivity) {
            return null;
        }

        return formatActivityToTraining(importedActivity);
    } catch (error) {
        console.error('Error fetching training:', error);

        return null;
    }
}

/**
 * Import a Strava activity with additional data
 */
export async function importActivity(
    stravaActivityId: number,
    additionalData: {
        heart_rate_zones: {
            zone_1?: string | undefined;
            zone_2?: string | undefined;
            zone_3?: string | undefined;
            zone_4?: string | undefined;
            zone_5?: string | undefined;
        };
        summary?: string | undefined;
        device?: string | undefined;
        battery_percent_usage?: number | undefined;
        effort?: number | undefined;
    }
) {
    const existingActivity = await getActivityByStravaId(BigInt(stravaActivityId));

    if (existingActivity) {
        throw new Error('Activity already imported');
    }

    return prisma.activity.create({
        data: {
            type: ActivityType.ride,
            strava_activity_id: BigInt(stravaActivityId),
            heart_rate_zone_1: additionalData.heart_rate_zones?.zone_1 ?? null,
            heart_rate_zone_2: additionalData.heart_rate_zones?.zone_2 ?? null,
            heart_rate_zone_3: additionalData.heart_rate_zones?.zone_3 ?? null,
            heart_rate_zone_4: additionalData.heart_rate_zones?.zone_4 ?? null,
            heart_rate_zone_5: additionalData.heart_rate_zones?.zone_5 ?? null,
            summary: additionalData.summary ?? null,
            device: additionalData.device ?? null,
            battery_percent_usage: additionalData.battery_percent_usage ?? null,
            effort: additionalData.effort ?? null
        }
    });
}
