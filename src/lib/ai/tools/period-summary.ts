import { periodSchema } from "@/lib/ai/tools/constants";
import { activityDateWhere, periodToStartDate, roundOneDecimal } from "@/lib/ai/tools/utils";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";
import { z } from "zod";

export async function getPeriodSummaryData(
    userId: string,
    input: { period: z.infer<typeof periodSchema>; type?: ActivityType },
) {
    const since = periodToStartDate(input.period);
    const sinceWhere = activityDateWhere(since);

    const activities = await prisma.activity.findMany({
        where: {
            user_id: userId,
            ...(input.type ? { type: input.type } : {}),
            ...(sinceWhere ?? {}),
        },
        select: {
            type: true,
            strava_activity: {
                select: {
                    distance_m: true,
                    moving_time_s: true,
                    avg_heart_rate_bpm: true,
                    elevation_gain_m: true,
                },
            },
            laps: {
                select: {
                    avg_power_watts: true,
                    moving_time_s: true,
                },
            },
        },
        take: 2000,
    });

    const byType: Record<string, number> = {};
    let totalDistanceM = 0;
    let totalMovingS = 0;
    let totalElevationM = 0;
    let hrSum = 0;
    let hrCount = 0;
    let powerWeightedSum = 0;
    let powerMovingS = 0;
    let activitiesWithPower = 0;

    for (const activity of activities) {
        byType[activity.type] = (byType[activity.type] ?? 0) + 1;

        if (activity.strava_activity) {
            totalDistanceM += activity.strava_activity.distance_m;
            totalMovingS += activity.strava_activity.moving_time_s;
            totalElevationM += activity.strava_activity.elevation_gain_m;

            if (activity.strava_activity.avg_heart_rate_bpm != null) {
                hrSum += activity.strava_activity.avg_heart_rate_bpm;
                hrCount++;
            }
        }

        let hasPowerInActivity = false;

        for (const lap of activity.laps) {
            if (lap.avg_power_watts != null && lap.avg_power_watts > 0 && lap.moving_time_s > 0) {
                powerWeightedSum += lap.avg_power_watts * lap.moving_time_s;
                powerMovingS += lap.moving_time_s;
                hasPowerInActivity = true;
            }
        }

        if (hasPowerInActivity) activitiesWithPower++;
    }

    const activityCount = activities.length;
    const totalDistanceKm = roundOneDecimal(totalDistanceM / 1000);
    const totalMovingHours = roundOneDecimal(totalMovingS / 3600);

    return {
        period: input.period,
        since: since.toISOString(),
        filter_type: input.type ?? null,
        activity_count: activityCount,
        total_distance_km: totalDistanceKm,
        total_moving_hours: totalMovingHours,
        avg_distance_km: activityCount > 0 ? roundOneDecimal(totalDistanceKm / activityCount) : 0,
        avg_moving_hours: activityCount > 0 ? roundOneDecimal(totalMovingHours / activityCount) : 0,
        avg_heart_rate_bpm: hrCount > 0 ? Math.round(hrSum / hrCount) : null,
        avg_power_watts: powerMovingS > 0 ? Math.round(powerWeightedSum / powerMovingS) : null,
        activities_with_power_count: activitiesWithPower,
        total_elevation_gain_m: totalElevationM,
        by_type: byType,
    };
}
