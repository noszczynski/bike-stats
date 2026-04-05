import { mapStravaActivity } from "@/lib/ai/tools/activity-mappers";
import { ACTIVITY_NOT_FOUND_MESSAGE, activityIdSchema } from "@/lib/ai/tools/constants";
import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export function createGetActivityOverviewTool(userId: string) {
    return createLoggedTool({
        name: "get_activity_overview",
        description:
            "Zwięzły przegląd jednej aktywności: metadane, liczby Strava, opis użytkownika i liczniki powiązanych danych (laps, trackpoints, tags).",
        inputSchema: z.object({
            activity_id: activityIdSchema,
        }),
        execute: async input => {
            const activity = await prisma.activity.findFirst({
                where: { id: input.activity_id, user_id: userId },
                select: {
                    id: true,
                    type: true,
                    summary: true,
                    notes: true,
                    effort: true,
                    device: true,
                    battery_percent_usage: true,
                    fit_processed: true,
                    created_at: true,
                    strava_activity: {
                        select: {
                            name: true,
                            date: true,
                            distance_m: true,
                            moving_time_s: true,
                            elevation_gain_m: true,
                            avg_speed_kmh: true,
                            max_speed_kmh: true,
                            avg_heart_rate_bpm: true,
                            max_heart_rate_bpm: true,
                        },
                    },
                    _count: {
                        select: {
                            laps: true,
                            trackpoints: true,
                            activity_tags: true,
                        },
                    },
                },
            });

            if (!activity) {
                return { error: ACTIVITY_NOT_FOUND_MESSAGE };
            }

            return {
                id: activity.id,
                type: activity.type,
                name: activity.strava_activity?.name ?? null,
                date:
                    activity.strava_activity?.date?.toISOString() ??
                    activity.created_at.toISOString(),
                summary: activity.summary,
                notes: activity.notes,
                effort: activity.effort,
                device: activity.device,
                battery_percent_usage: activity.battery_percent_usage,
                fit_processed: activity.fit_processed,
                strava_activity: mapStravaActivity(activity.strava_activity),
                lap_count: activity._count.laps,
                trackpoint_count: activity._count.trackpoints,
                tag_count: activity._count.activity_tags,
            };
        },
    });
}
