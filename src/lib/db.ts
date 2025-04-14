import { prisma } from './prisma';

/**
 * Get an activity by Strava activity ID
 */
export async function getActivityByStravaId(stravaActivityId: bigint) {
    return prisma.activity.findUnique({
        where: {
            strava_activity_id: stravaActivityId
        }
    });
}

/**
 * Get an activity by id
 */
export async function getActivityById(id: string) {
    return prisma.activity.findUnique({
        where: {
            id
        },
        include: {
            strava_activity: true,
        }
    });
}

