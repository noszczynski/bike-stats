import { ActivityType, Prisma } from '@/generated/prisma';
import { getActivity, getAllStravaRideActivities } from '@/lib/api/strava';
import { Training, TrainingSchema } from '@/types/training';

import { getActivitiesByType, getActivityById, getActivityByStravaId } from '../db';
import { prisma } from '../prisma';
import dayjs from 'dayjs';
import { Decimal } from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

function metersToKilometers(meters: number) {
    return meters / 1000;
}

/**
 * Convert Strava activity to Training type
 */
function stravaActivityToTraining(activity: any, importedActivity: any = null): Training {
    return {
        id: importedActivity?.id ?? uuidv4(),
        strava_activity_id: activity.id,
        name: activity.name,
        date: dayjs(activity.start_date).format('YYYY-MM-DD'),
        distance_km: metersToKilometers(activity.distance),
        elevation_gain_m: activity.total_elevation_gain,
        moving_time: `${Math.floor(activity.moving_time / 3600)
            .toString()
            .padStart(2, '0')}:${Math.floor((activity.moving_time % 3600) / 60)
            .toString()
            .padStart(2, '0')}:${(activity.moving_time % 60).toString().padStart(2, '0')}`,
        avg_speed_kmh: activity.average_speed,
        max_speed_kmh: activity.max_speed,
        avg_heart_rate_bpm: activity.average_heartrate,
        max_heart_rate_bpm: activity.max_heartrate,
        heart_rate_zones:
            importedActivity &&
            importedActivity.heart_rate_zone_1 &&
            importedActivity.heart_rate_zone_2 &&
            importedActivity.heart_rate_zone_3 &&
            importedActivity.heart_rate_zone_4 &&
            importedActivity.heart_rate_zone_5
                ? {
                      zone_1: importedActivity.heart_rate_zone_1,
                      zone_2: importedActivity.heart_rate_zone_2,
                      zone_3: importedActivity.heart_rate_zone_3,
                      zone_4: importedActivity.heart_rate_zone_4,
                      zone_5: importedActivity.heart_rate_zone_5
                  }
                : null,
        summary: importedActivity?.summary ?? null,
        device: importedActivity?.device ?? null,
        battery_percent_usage: importedActivity?.battery_percent_usage ?? null,
        effort: importedActivity?.effort ?? null
    } satisfies Training;
}

/**
 * Fetch all imported trainings from the database
 */
export async function getAllTrainings(): Promise<Training[]> {
    // Get all imported activities with their Strava data
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

    // Convert to Training type
    const trainings = importedActivities.map((activity) => {
        if (!activity.strava_activity) {
            throw new Error(`No Strava activity found for imported activity ${activity.id}`);
        }

        const stravaActivity = {
            id: Number(activity.strava_activity_id),
            name: activity.strava_activity.name,
            start_date: activity.strava_activity.date,
            distance: activity.strava_activity.distance_m,
            total_elevation_gain: activity.strava_activity.elevation_gain_m,
            moving_time: parseInt(activity.strava_activity.moving_time_s),
            average_speed: new Decimal(activity.strava_activity.avg_speed_kmh).toNumber(),
            max_speed: new Decimal(activity.strava_activity.max_speed_kmh).toNumber(),
            average_heartrate: activity.strava_activity.avg_heart_rate_bpm,
            max_heartrate: activity.strava_activity.max_heart_rate_bpm
        };

        return stravaActivityToTraining(stravaActivity, activity);
    });

    return z.array(TrainingSchema).parse(trainings);
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

/**
 * Fetch a specific training by ID from Strava API and local database
 */
export async function getTrainingById(
    trainingId: string,
    accessToken: string,
    refreshToken: string
): Promise<Training | null> {
    try {
        // First try to find the imported activity
        const importedActivity = await getActivityById(trainingId);

        if (!importedActivity) {
            return null;
        }

        // Get the Strava activity data
        const stravaActivity = await getActivity(
            Number(importedActivity.strava_activity_id),
            accessToken,
            refreshToken
        );

        if (!stravaActivity) {
            return null;
        }

        return stravaActivityToTraining(stravaActivity, importedActivity);
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
