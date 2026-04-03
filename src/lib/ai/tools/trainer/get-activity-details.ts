import { mapStravaActivity } from "@/lib/ai/tools/activity-mappers";
import { ACTIVITY_NOT_FOUND_MESSAGE, activityIdSchema } from "@/lib/ai/tools/constants";
import { mapLapMetrics, resolveActivityFitSummary } from "@/lib/ai/tools/fit-metrics";
import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export function createGetActivityDetailsTool(userId: string) {
    return createLoggedTool({
        name: "get_activity_details",
        description:
            "Pełniejszy snapshot jednej aktywności: overview + tagi + strefy HR + fit_summary. Używaj, gdy potrzebny jest jeden szeroki widok zamiast kilku mniejszych tooli.",
        inputSchema: z.object({
            activity_id: activityIdSchema,
            include_full_laps: z
                .boolean()
                .optional()
                .describe("Domyślnie false — bez pełnej tablicy okrążeń"),
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
                    heart_rate_zone_1: true,
                    heart_rate_zone_2: true,
                    heart_rate_zone_3: true,
                    heart_rate_zone_4: true,
                    heart_rate_zone_5: true,
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
                    laps: {
                        orderBy: { lap_number: "asc" },
                        select: {
                            lap_number: true,
                            distance_m: true,
                            moving_time_s: true,
                            avg_speed_ms: true,
                            max_speed_ms: true,
                            avg_heart_rate_bpm: true,
                            max_heart_rate_bpm: true,
                            avg_power_watts: true,
                            max_power_watts: true,
                            avg_cadence_rpm: true,
                            max_cadence_rpm: true,
                            total_elevation_gain_m: true,
                        },
                    },
                    activity_tags: {
                        select: {
                            tag: {
                                select: {
                                    name: true,
                                    description: true,
                                    color: true,
                                    icon: true,
                                },
                            },
                            is_auto_generated: true,
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

            const fitData = await resolveActivityFitSummary(
                activity.id,
                activity.fit_processed,
                mapLapMetrics(activity.laps),
                { includeLapTotals: true },
            );

            return {
                id: activity.id,
                type: activity.type,
                summary: activity.summary,
                notes: activity.notes,
                effort: activity.effort,
                device: activity.device,
                battery_percent_usage: activity.battery_percent_usage,
                fit_processed: activity.fit_processed,
                created_at: activity.created_at.toISOString(),
                strava_activity: mapStravaActivity(activity.strava_activity),
                counts: {
                    laps: activity._count.laps,
                    trackpoints: activity._count.trackpoints,
                    tags: activity._count.activity_tags,
                },
                zones: {
                    zone_1: activity.heart_rate_zone_1,
                    zone_2: activity.heart_rate_zone_2,
                    zone_3: activity.heart_rate_zone_3,
                    zone_4: activity.heart_rate_zone_4,
                    zone_5: activity.heart_rate_zone_5,
                },
                tags: activity.activity_tags.map(item => ({
                    name: item.tag.name,
                    description: item.tag.description,
                    color: item.tag.color,
                    icon: item.tag.icon,
                    is_auto_generated: item.is_auto_generated,
                })),
                ...fitData,
                ...(input.include_full_laps === true ? { laps: activity.laps } : {}),
            };
        },
    });
}
