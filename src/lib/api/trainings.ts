import { getActivities, getActivity } from '@/app/api/_lib/strava';
import { ActivityType, Prisma } from '@/generated/prisma';
import { Training, TrainingSchema } from '@/types/training';

import { getActivitiesByType, getActivityById, getActivityByStravaId } from '../db';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

function metersToKilometers(meters: number) {
    return meters / 1000;
}

/**
 * Fetch all trainings from the API
 */
export async function getAllTrainings(accessToken: string, refreshToken: string): Promise<Training[]> {
    const stravaActivities = await getActivities(accessToken, refreshToken, { per_page: 100 });

    if (!stravaActivities.length) {
        return [];
    }

    const bikeActivities = stravaActivities.filter((activity) => activity.sport_type === 'Ride');

    if (!bikeActivities.length) {
        return [];
    }

    const trainings = await getActivitiesByType(ActivityType.ride);

    const trainingsWithStravaData = bikeActivities
        .map((activity) => {
            const training = trainings.find((training) => training.strava_activity_id === BigInt(activity.id));

            return { activity, training };
        })
        .map(({ activity, training }) => {
            return {
                id: training?.id ?? uuidv4(),
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
                    training &&
                    training.heart_rate_zone_1 &&
                    training.heart_rate_zone_2 &&
                    training.heart_rate_zone_3 &&
                    training.heart_rate_zone_4 &&
                    training.heart_rate_zone_5
                        ? {
                              zone_1: training.heart_rate_zone_1,
                              zone_2: training.heart_rate_zone_2,
                              zone_3: training.heart_rate_zone_3,
                              zone_4: training.heart_rate_zone_4,
                              zone_5: training.heart_rate_zone_5
                          }
                        : null,
                summary: training?.summary ?? null,
                device: training?.device ?? null,
                battery_percent_usage: training?.battery_percent_usage ?? null,
                effort: training?.effort ?? null
            } satisfies Training;
        });

    return z.array(TrainingSchema).parse(trainingsWithStravaData);
}

/**
 * Fetch a specific training by ID from the API
 */
export async function getTrainingById(
    trainingId: string,
    accessToken: string,
    refreshToken: string
): Promise<Training | null> {
    try {
        const training = await getActivityById(trainingId);

        if (!training) {
            return null;
        }

        const stravaActivity = await getActivity(Number(training.strava_activity_id), accessToken, refreshToken);

        if (!stravaActivity) {
            return null;
        }

        return {
            id: training.id,
            strava_activity_id: stravaActivity.id,
            name: stravaActivity.name,
            date: dayjs(stravaActivity.start_date).format('YYYY-MM-DD'),
            distance_km: stravaActivity.distance,
            elevation_gain_m: stravaActivity.total_elevation_gain,
            moving_time: `${Math.floor(stravaActivity.moving_time / 3600)
                .toString()
                .padStart(2, '0')}:${Math.floor((stravaActivity.moving_time % 3600) / 60)
                .toString()
                .padStart(2, '0')}:${(stravaActivity.moving_time % 60).toString().padStart(2, '0')}`,
            avg_speed_kmh: stravaActivity.average_speed,
            max_speed_kmh: stravaActivity.max_speed,
            avg_heart_rate_bpm: stravaActivity.average_heartrate,
            max_heart_rate_bpm: stravaActivity.max_heartrate,
            heart_rate_zones:
                training &&
                training.heart_rate_zone_1 &&
                training.heart_rate_zone_2 &&
                training.heart_rate_zone_3 &&
                training.heart_rate_zone_4 &&
                training.heart_rate_zone_5
                    ? {
                          zone_1: training.heart_rate_zone_1,
                          zone_2: training.heart_rate_zone_2,
                          zone_3: training.heart_rate_zone_3,
                          zone_4: training.heart_rate_zone_4,
                          zone_5: training.heart_rate_zone_5
                      }
                    : null,
            summary: training.summary ?? null,
            device: training.device ?? null,
            battery_percent_usage: training.battery_percent_usage ?? null,
            effort: training.effort ?? null
        } satisfies Training;
    } catch (error) {
        console.error('Error fetching training:', error);

        return null;
    }
}
