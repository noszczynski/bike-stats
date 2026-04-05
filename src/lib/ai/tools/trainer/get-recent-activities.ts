import { mapLapMetrics, mapRecentActivityItem } from "@/lib/ai/tools/fit-metrics";
import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { activityDateWhere, parseActivityDateBounds } from "@/lib/ai/tools/utils";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";
import { z } from "zod";

export function createGetRecentActivitiesTool(userId: string) {
    return createLoggedTool({
        name: "get_recent_activities",
        description:
            "Lista ostatnich aktywności użytkownika z filtrami. Zwraca lekki przegląd: metadane, tagi, podstawowe liczby Strava i mały fit_from_file z laps, gdy dostępny.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(50).optional().describe("Domyślnie 20, max 50"),
            type: z.nativeEnum(ActivityType).optional(),
            date_from: z
                .string()
                .optional()
                .describe("Początek zakresu dat w ISO 8601 lub YYYY-MM-DD"),
            date_to: z.string().optional().describe("Koniec zakresu dat w ISO 8601 lub YYYY-MM-DD"),
            has_fit_file: z
                .boolean()
                .optional()
                .describe("true: tylko aktywności z przetworzonym FIT, false: bez FIT"),
            has_power_data: z
                .boolean()
                .optional()
                .describe("true: tylko aktywności z danymi mocy w laps, false: bez takich danych"),
        }),
        execute: async input => {
            const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
            const { from, to } = parseActivityDateBounds(input.date_from, input.date_to);
            const datePart = activityDateWhere(from, to);

            const activities = await prisma.activity.findMany({
                where: {
                    user_id: userId,
                    ...(input.type ? { type: input.type } : {}),
                    ...(datePart ?? {}),
                    ...(input.has_fit_file != null ? { fit_processed: input.has_fit_file } : {}),
                    ...(input.has_power_data === true
                        ? {
                              laps: {
                                  some: {
                                      avg_power_watts: { gt: 0 },
                                  },
                              },
                          }
                        : {}),
                    ...(input.has_power_data === false
                        ? {
                              laps: {
                                  none: {
                                      avg_power_watts: { gt: 0 },
                                  },
                              },
                          }
                        : {}),
                },
                orderBy: [{ created_at: "desc" }],
                take: limit,
                select: {
                    id: true,
                    type: true,
                    summary: true,
                    notes: true,
                    effort: true,
                    device: true,
                    created_at: true,
                    fit_processed: true,
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
                    activity_tags: {
                        select: {
                            tag: { select: { name: true } },
                        },
                    },
                    laps: {
                        select: {
                            avg_power_watts: true,
                            max_power_watts: true,
                            moving_time_s: true,
                            distance_m: true,
                            avg_cadence_rpm: true,
                            max_cadence_rpm: true,
                            avg_heart_rate_bpm: true,
                            max_heart_rate_bpm: true,
                        },
                    },
                },
            });

            return {
                count: activities.length,
                filters: {
                    type: input.type ?? null,
                    date_from: input.date_from ?? null,
                    date_to: input.date_to ?? null,
                    has_fit_file: input.has_fit_file ?? null,
                    has_power_data: input.has_power_data ?? null,
                },
                activities: activities.map(activity =>
                    mapRecentActivityItem({
                        ...activity,
                        laps: mapLapMetrics(activity.laps),
                    }),
                ),
            };
        },
    });
}
