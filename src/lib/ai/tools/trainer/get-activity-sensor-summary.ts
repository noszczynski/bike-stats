import { ACTIVITY_NOT_FOUND_MESSAGE, activityIdSchema } from "@/lib/ai/tools/constants";
import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export function createGetActivitySensorSummaryTool(userId: string) {
    return createLoggedTool({
        name: "get_activity_sensor_summary",
        description:
            "Dostępność danych sensorów i gęstość próbek dla aktywności: HR, kadencja, moc, GPS, temperatura oraz liczba laps/trackpoints.",
        inputSchema: z.object({
            activity_id: activityIdSchema,
        }),
        execute: async input => {
            const activity = await prisma.activity.findFirst({
                where: { id: input.activity_id, user_id: userId },
                select: {
                    id: true,
                    fit_processed: true,
                    _count: {
                        select: {
                            laps: true,
                            trackpoints: true,
                        },
                    },
                },
            });

            if (!activity) {
                return { error: ACTIVITY_NOT_FOUND_MESSAGE };
            }

            const [heartRatePoints, cadencePoints, powerPoints, gpsPoints, temperaturePoints] =
                await Promise.all([
                    prisma.trackpoint.count({
                        where: { activity_id: input.activity_id, heart_rate_bpm: { not: null } },
                    }),
                    prisma.trackpoint.count({
                        where: { activity_id: input.activity_id, cadence_rpm: { not: null } },
                    }),
                    prisma.trackpoint.count({
                        where: { activity_id: input.activity_id, power_watts: { not: null } },
                    }),
                    prisma.trackpoint.count({
                        where: {
                            activity_id: input.activity_id,
                            latitude: { not: null },
                            longitude: { not: null },
                        },
                    }),
                    prisma.trackpoint.count({
                        where: { activity_id: input.activity_id, temperature_c: { not: null } },
                    }),
                ]);

            return {
                activity_id: activity.id,
                fit_processed: activity.fit_processed,
                lap_count: activity._count.laps,
                trackpoint_count: activity._count.trackpoints,
                sensors: {
                    heart_rate_points: heartRatePoints,
                    cadence_points: cadencePoints,
                    power_points: powerPoints,
                    gps_points: gpsPoints,
                    temperature_points: temperaturePoints,
                    has_heart_rate: heartRatePoints > 0,
                    has_cadence: cadencePoints > 0,
                    has_power: powerPoints > 0,
                    has_gps: gpsPoints > 0,
                    has_temperature: temperaturePoints > 0,
                },
            };
        },
    });
}
