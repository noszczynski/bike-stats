import type { Activity, ActivityType } from '../../src/generated/prisma';
import { prisma } from './prisma';

// Type for creating a new activity
export type ActivityCreate = {
    type: ActivityType;
    strava_activity_id: bigint;
    heart_rate_zone_1?: string | null;
    heart_rate_zone_2?: string | null;
    heart_rate_zone_3?: string | null;
    heart_rate_zone_4?: string | null;
    heart_rate_zone_5?: string | null;
    summary?: string | null;
    battery_percent_usage?: number | null;
    device?: string | null;
    effort?: number | null;
};

/**
 * Create a new activity record
 */
export async function createActivity(data: ActivityCreate) {
    return prisma.activity.create({
        data
    });
}

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
        }
    });
}

/**
 * Get activities by type
 */
export async function getActivitiesByType(type: ActivityType) {
    return prisma.activity.findMany({
        where: {
            type
        },
        orderBy: {
            created_at: 'desc'
        }
    });
}

/**
 * Update an activity
 */
export async function updateActivity(id: string, data: Partial<Omit<ActivityCreate, 'strava_activity_id'>>) {
    return prisma.activity.update({
        where: { id },
        data
    });
}

/**
 * Delete an activity
 */
export async function deleteActivity(id: string) {
    return prisma.activity.delete({
        where: { id }
    });
}
