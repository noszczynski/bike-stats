import { getActivity, getAllStravaRideActivities } from "@/lib/api/strava";
import { meterPerSecondToKmph } from "@/lib/convert/meter-per-second-to-kmph";
import { Training, TrainingSchema } from "@/types/training";
import { secondsToTimeString } from "@/utils/time";
import { ActivityType, type Activity, type StravaActivity } from "@prisma/client";
import dayjs from "dayjs";
import { Decimal } from "decimal.js";
import { z } from "zod";

import { getActivityById, getActivityByStravaId } from "../db";
import { prisma } from "../prisma";

/**
 * Map Strava sport_type to ActivityType enum
 */
function mapStravaSportTypeToActivityType(sportType: string): ActivityType {
    const mapping: Record<string, ActivityType> = {
        Ride: ActivityType.ride,
        VirtualRide: ActivityType.virtual_ride,
        GravelRide: ActivityType.gravel_ride,
        MountainBikeRide: ActivityType.mountain_bike_ride,
        Run: ActivityType.run,
        Walk: ActivityType.walk,
        Hike: ActivityType.hike,
        Swim: ActivityType.swim,
        Workout: ActivityType.workout,
        Soccer: ActivityType.soccer,
    };

    return mapping[sportType] || ActivityType.ride;
}

function formatActivityToTraining(
    activity: Activity & { strava_activity: StravaActivity | null },
): Training {
    if (!activity.strava_activity) {
        throw new Error("Activity must have strava_activity to be formatted as Training");
    }

    return {
        id: activity.id,
        strava_activity_id: Number(activity.strava_activity.id),
        name: activity.strava_activity.name,
        type: activity.type as Training["type"],
        date: dayjs(activity.strava_activity.date).format("YYYY-MM-DD"),
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
                      zone_5: activity.heart_rate_zone_5,
                  }
                : null,
        summary: activity.summary ?? null,
        notes: activity.notes ?? null,
        device: activity.device ?? null,
        battery_percent_usage: activity.battery_percent_usage ?? null,
        effort: activity.effort ?? null,
        map: activity.strava_activity.map_summary_polyline
            ? {
                  id: activity.strava_activity.map_summary_id,
                  summary_polyline: activity.strava_activity.map_summary_polyline,
              }
            : null,
        fit_processed: activity.fit_processed,
    } satisfies Training;
}

// Define filter types
export type TrainingFilters = {
    startDate?: string;
    endDate?: string;
    type?: string;
    minDistance?: number;
    maxDistance?: number;
    minHeartRate?: number;
    maxHeartRate?: number;
    minSpeed?: number;
    maxSpeed?: number;
    minElevation?: number;
    maxElevation?: number;
    minTime?: number; // in minutes
    maxTime?: number; // in minutes
    tagIds?: string[];
    hasHeartRateData?: boolean;
    hasFitData?: boolean;
};

export type PaginationOptions = {
    page?: number;
    pageSize?: number;
};

export type TrainingsResponse = {
    trainings: Training[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

/**
 * Fetch all imported trainings from the database
 */
export async function getAllTrainings(
    filters: TrainingFilters = {},
    pagination: PaginationOptions = { page: 1, pageSize: 200 },
): Promise<TrainingsResponse> {
    const {
        startDate,
        endDate,
        type,
        minDistance,
        maxDistance,
        minHeartRate,
        maxHeartRate,
        minSpeed,
        maxSpeed,
        minElevation,
        maxElevation,
        minTime,
        maxTime,
        tagIds,
        hasHeartRateData,
        hasFitData,
    } = filters;
    const { page = 1, pageSize = 200 } = pagination;

    const skip = (page - 1) * pageSize;

    // Build where clause based on filters
    const where: any = {};

    // Handle type filter - if not specified, show ride and virtual_ride by default
    if (type) {
        where.type = type;
    } else {
        // Default: show ride and virtual_ride
        where.type = {
            in: [ActivityType.ride, ActivityType.virtual_ride],
        };
    }

    // Initialize strava_activity filter object
    if (
        startDate ||
        endDate ||
        minDistance ||
        maxDistance ||
        minHeartRate ||
        maxHeartRate ||
        minSpeed ||
        maxSpeed ||
        minElevation ||
        maxElevation ||
        minTime ||
        maxTime
    ) {
        where.strava_activity = {};
    }

    // Add date range filter
    if (startDate || endDate) {
        where.strava_activity.date = {};
        if (startDate) {
            where.strava_activity.date.gte = new Date(startDate);
        }
        if (endDate) {
            where.strava_activity.date.lte = new Date(endDate);
        }
    }

    // Add distance filter (convert km to meters)
    if (minDistance !== undefined || maxDistance !== undefined) {
        where.strava_activity.distance_m = {};
        if (minDistance !== undefined) {
            where.strava_activity.distance_m.gte = minDistance * 1000;
        }
        if (maxDistance !== undefined) {
            where.strava_activity.distance_m.lte = maxDistance * 1000;
        }
    }

    // Add heart rate filter
    if (minHeartRate !== undefined || maxHeartRate !== undefined) {
        where.strava_activity.avg_heart_rate_bpm = {};
        if (minHeartRate !== undefined) {
            where.strava_activity.avg_heart_rate_bpm.gte = minHeartRate;
        }
        if (maxHeartRate !== undefined) {
            where.strava_activity.avg_heart_rate_bpm.lte = maxHeartRate;
        }
    }

    // Add speed filter (convert km/h to m/s for avg_speed_kmh)
    if (minSpeed !== undefined || maxSpeed !== undefined) {
        where.strava_activity.avg_speed_kmh = {};
        if (minSpeed !== undefined) {
            where.strava_activity.avg_speed_kmh.gte = minSpeed;
        }
        if (maxSpeed !== undefined) {
            where.strava_activity.avg_speed_kmh.lte = maxSpeed;
        }
    }

    // Add elevation filter
    if (minElevation !== undefined || maxElevation !== undefined) {
        where.strava_activity.elevation_gain_m = {};
        if (minElevation !== undefined) {
            where.strava_activity.elevation_gain_m.gte = minElevation;
        }
        if (maxElevation !== undefined) {
            where.strava_activity.elevation_gain_m.lte = maxElevation;
        }
    }

    // Add time filter (convert minutes to seconds)
    if (minTime !== undefined || maxTime !== undefined) {
        where.strava_activity.moving_time_s = {};
        if (minTime !== undefined) {
            where.strava_activity.moving_time_s.gte = minTime * 60;
        }
        if (maxTime !== undefined) {
            where.strava_activity.moving_time_s.lte = maxTime * 60;
        }
    }

    // Add heart rate data filter
    if (hasHeartRateData !== undefined) {
        if (hasHeartRateData) {
            where.strava_activity.avg_heart_rate_bpm = { not: null };
        } else {
            where.strava_activity.avg_heart_rate_bpm = null;
        }
    }

    // Add FIT data filter
    if (hasFitData !== undefined) {
        where.fit_processed = hasFitData;
    }

    // Add tags filter
    if (tagIds && tagIds.length > 0) {
        where.activity_tags = {
            some: {
                tag_id: {
                    in: tagIds,
                },
            },
        };
    }

    // Query for total count first (without pagination)
    const totalCount = await prisma.activity.count({ where });

    // Then query for the actual data with pagination
    const importedActivities = await prisma.activity.findMany({
        where,
        include: {
            strava_activity: true,
            activity_tags: {
                include: {
                    tag: true,
                },
            },
        },
        orderBy: {
            strava_activity: {
                date: "desc",
            },
        },
        skip,
        take: pageSize,
    });

    const trainings = z
        .array(TrainingSchema)
        .parse(importedActivities.map(formatActivityToTraining));

    return {
        trainings,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
    };
}

export async function getTrainingsToImport(accessToken: string, refreshToken: string) {
    const stravaActivities = await prisma.stravaActivity.findMany({
        orderBy: {
            created_at: "desc",
        },
    });
    const stravaRides = await getAllStravaRideActivities(accessToken, refreshToken);

    /** Filter out activities that are already imported to database */
    return stravaRides.filter(
        ride => !stravaActivities.some(activity => activity.id === BigInt(ride.id)),
    );
}

export async function updateTrainings(accessToken: string, refreshToken: string) {
    const trainingsToImport = await getTrainingsToImport(accessToken, refreshToken);

    const activityIds: string[] = [];

    await prisma.$transaction(async tx => {
        for await (const training of trainingsToImport) {
            const activityType = mapStravaSportTypeToActivityType(training.sport_type);
            const stravaActivity = await tx.stravaActivity.create({
                data: {
                    id: Number(training.id),
                    name: training.name,
                    date: training.start_date,
                    distance_m: Number(training.distance),
                    elevation_gain_m: Number(training.total_elevation_gain),
                    moving_time_s: Number(training.moving_time),
                    avg_speed_kmh: new Decimal(meterPerSecondToKmph(training.average_speed)),
                    max_speed_kmh: new Decimal(meterPerSecondToKmph(training.max_speed)),
                    avg_heart_rate_bpm: Number(training.average_heartrate),
                    max_heart_rate_bpm: Number(training.max_heartrate),
                    activity: {
                        create: {
                            type: activityType,
                            device: training.device_name,
                            user_id: "b3c8fc32-b5e8-4f90-8048-b8663d3bf02b", // todo: get user id from auth
                        },
                    },
                },
                include: {
                    activity: true,
                },
            });

            if (stravaActivity.activity) {
                activityIds.push(stravaActivity.activity.id);
            }
        }
    });

    // Apply auto-tagging for all imported activities (outside transaction)
    for (const activityId of activityIds) {
        try {
            const { applyAutoTagging } = await import("@/features/training/auto-tagging-rules");
            await applyAutoTagging(activityId);
        } catch (error) {
            console.error(`Error applying auto-tagging for activity ${activityId}:`, error);
            // Don't fail the import if auto-tagging fails
        }
    }

    return { importedCount: activityIds.length };
}

/**
 * Fetch a specific training by ID from Strava API and local database
 */
export async function getTrainingById(trainingId: string): Promise<Training | null> {
    try {
        // First try to find the imported activity
        const importedActivity = await getActivityById(trainingId);

        if (!importedActivity) {
            return null;
        }

        return formatActivityToTraining(importedActivity);
    } catch (error) {
        console.error("Error fetching training:", error);

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
        accessToken?: string | undefined;
        refreshToken?: string | undefined;
    },
) {
    const existingActivity = await getActivityByStravaId(BigInt(stravaActivityId));

    if (existingActivity) {
        throw new Error("Activity already imported");
    }

    // Fetch activity from Strava to get sport_type
    let activityType: ActivityType = ActivityType.ride; // default fallback
    if (additionalData.accessToken && additionalData.refreshToken) {
        try {
            const stravaActivity = await getActivity(
                stravaActivityId,
                additionalData.accessToken,
                additionalData.refreshToken,
            );
            activityType = mapStravaSportTypeToActivityType(stravaActivity.sport_type);
        } catch (error) {
            console.error("Failed to fetch activity from Strava for type mapping:", error);
            // Fallback to default ride type
        }
    }

    const activity = await prisma.activity.create({
        data: {
            type: activityType,
            strava_activity_id: BigInt(stravaActivityId),
            heart_rate_zone_1: additionalData.heart_rate_zones?.zone_1 ?? null,
            heart_rate_zone_2: additionalData.heart_rate_zones?.zone_2 ?? null,
            heart_rate_zone_3: additionalData.heart_rate_zones?.zone_3 ?? null,
            heart_rate_zone_4: additionalData.heart_rate_zones?.zone_4 ?? null,
            heart_rate_zone_5: additionalData.heart_rate_zones?.zone_5 ?? null,
            summary: additionalData.summary ?? null,
            device: additionalData.device ?? null,
            battery_percent_usage: additionalData.battery_percent_usage ?? null,
            effort: additionalData.effort ?? null,
            user_id: "b3c8fc32-b5e8-4f90-8048-b8663d3bf02b", // todo: get user id from auth
        },
    });

    // Apply auto-tagging after activity creation
    try {
        const { applyAutoTagging } = await import("@/features/training/auto-tagging-rules");
        await applyAutoTagging(activity.id);
    } catch (error) {
        console.error("Error applying auto-tagging:", error);
        // Don't fail the import if auto-tagging fails
    }

    return activity;
}

/**
 * Update a training's details
 */
export async function updateTraining(
    trainingId: string,
    data: {
        heart_rate_zones?: {
            zone_1?: string;
            zone_2?: string;
            zone_3?: string;
            zone_4?: string;
            zone_5?: string;
        };
        summary?: string;
        device?: string;
        battery_percent_usage?: number;
        effort?: number;
    },
): Promise<Training> {
    const activity = await prisma.activity.update({
        where: {
            id: trainingId,
        },
        data: {
            heart_rate_zone_1: data.heart_rate_zones?.zone_1 ?? undefined,
            heart_rate_zone_2: data.heart_rate_zones?.zone_2 ?? undefined,
            heart_rate_zone_3: data.heart_rate_zones?.zone_3 ?? undefined,
            heart_rate_zone_4: data.heart_rate_zones?.zone_4 ?? undefined,
            heart_rate_zone_5: data.heart_rate_zones?.zone_5 ?? undefined,
            summary: data.summary ?? undefined,
            device: data.device ?? undefined,
            battery_percent_usage: data.battery_percent_usage ?? undefined,
            effort: data.effort ?? undefined,
        },
        include: {
            strava_activity: true,
        },
    });

    if (!activity || !activity.strava_activity) {
        throw new Error("Activity not found");
    }

    return formatActivityToTraining(activity);
}

// Client-side version of updateTrainings that calls the API route instead of using Prisma directly
export async function updateTrainingsClient(accessToken: string, refreshToken: string) {
    const response = await fetch("/api/trainings/update", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken, refreshToken }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update trainings");
    }

    return response.json();
}

/**
 * Get aggregated power and cadence statistics from all laps
 */
export async function getPowerAndCadenceStats() {
    const laps = await prisma.lap.findMany({
        where: {
            OR: [
                { avg_power_watts: { not: null, gt: 0 } },
                { avg_cadence_rpm: { not: null, gt: 0 } },
            ],
        },
        select: {
            avg_power_watts: true,
            max_power_watts: true,
            avg_cadence_rpm: true,
            max_cadence_rpm: true,
            activity: {
                select: {
                    strava_activity: {
                        select: {
                            date: true,
                        },
                    },
                },
            },
        },
    });

    // Calculate averages
    const powerLaps = laps.filter(lap => lap.avg_power_watts && lap.avg_power_watts > 0);
    const cadenceLaps = laps.filter(lap => lap.avg_cadence_rpm && lap.avg_cadence_rpm > 0);

    const avgPower =
        powerLaps.length > 0
            ? powerLaps.reduce((sum, lap) => sum + (lap.avg_power_watts || 0), 0) / powerLaps.length
            : null;

    const maxPower =
        powerLaps.length > 0 ? Math.max(...powerLaps.map(lap => lap.max_power_watts || 0)) : null;

    const avgCadence =
        cadenceLaps.length > 0
            ? cadenceLaps.reduce((sum, lap) => sum + (lap.avg_cadence_rpm || 0), 0) /
              cadenceLaps.length
            : null;

    const maxCadence =
        cadenceLaps.length > 0
            ? Math.max(...cadenceLaps.map(lap => lap.max_cadence_rpm || 0))
            : null;

    // Calculate stats for last 30 days
    const thirtyDaysAgo = dayjs().subtract(30, "day").toDate();
    const recentPowerLaps = powerLaps.filter(lap =>
        dayjs(lap.activity.strava_activity?.date).isAfter(thirtyDaysAgo),
    );
    const recentCadenceLaps = cadenceLaps.filter(lap =>
        dayjs(lap.activity.strava_activity?.date).isAfter(thirtyDaysAgo),
    );

    const recentAvgPower =
        recentPowerLaps.length > 0
            ? recentPowerLaps.reduce((sum, lap) => sum + (lap.avg_power_watts || 0), 0) /
              recentPowerLaps.length
            : null;

    const recentAvgCadence =
        recentCadenceLaps.length > 0
            ? recentCadenceLaps.reduce((sum, lap) => sum + (lap.avg_cadence_rpm || 0), 0) /
              recentCadenceLaps.length
            : null;

    return {
        power: {
            avg: avgPower,
            max: maxPower,
            recentAvg: recentAvgPower,
            trainingsWithData: powerLaps.length,
        },
        cadence: {
            avg: avgCadence,
            max: maxCadence,
            recentAvg: recentAvgCadence,
            trainingsWithData: cadenceLaps.length,
        },
    };
}
