import { getOwnedActivityId } from "@/lib/ai/tools/activity-queries";
import { ACTIVITY_NOT_FOUND_MESSAGE, activityIdSchema } from "@/lib/ai/tools/constants";
import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export function createGetActivityLapsTool(userId: string) {
    return createLoggedTool({
        name: "get_activity_laps",
        description:
            "Lista okrążeń jednej aktywności. Przydatne do analizy interwałów, spadków mocy, tętna i zmienności tempa.",
        inputSchema: z.object({
            activity_id: activityIdSchema,
            limit: z.number().int().min(1).max(200).optional().describe("Domyślnie 50, max 200"),
        }),
        execute: async input => {
            const activity = await getOwnedActivityId(userId, input.activity_id);

            if (!activity) {
                return { error: ACTIVITY_NOT_FOUND_MESSAGE };
            }

            const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
            const laps = await prisma.lap.findMany({
                where: { activity_id: input.activity_id },
                orderBy: { lap_number: "asc" },
                take: limit,
                select: {
                    lap_number: true,
                    start_time: true,
                    end_time: true,
                    distance_m: true,
                    moving_time_s: true,
                    elapsed_time_s: true,
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
            });

            return {
                activity_id: input.activity_id,
                returned_lap_count: laps.length,
                laps,
            };
        },
    });
}
