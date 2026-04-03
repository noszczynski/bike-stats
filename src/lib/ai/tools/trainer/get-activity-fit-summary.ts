import { ACTIVITY_NOT_FOUND_MESSAGE, activityIdSchema } from "@/lib/ai/tools/constants";
import { mapLapMetrics, resolveActivityFitSummary } from "@/lib/ai/tools/fit-metrics";
import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export function createGetActivityFitSummaryTool(userId: string) {
    return createLoggedTool({
        name: "get_activity_fit_summary",
        description:
            "Zwarte metryki z pliku FIT dla jednej aktywności: lap_count, moc, kadencja, tętno i ewentualne uzupełnienie z trackpointów.",
        inputSchema: z.object({
            activity_id: activityIdSchema,
            include_totals: z
                .boolean()
                .optional()
                .describe("Czy zwrócić też total distance i moving time z agregacji FIT"),
        }),
        execute: async input => {
            const activity = await prisma.activity.findFirst({
                where: { id: input.activity_id, user_id: userId },
                select: {
                    id: true,
                    fit_processed: true,
                    laps: {
                        select: {
                            moving_time_s: true,
                            distance_m: true,
                            avg_power_watts: true,
                            max_power_watts: true,
                            avg_cadence_rpm: true,
                            max_cadence_rpm: true,
                            avg_heart_rate_bpm: true,
                            max_heart_rate_bpm: true,
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
                { includeLapTotals: input.include_totals ?? false },
            );

            return {
                activity_id: activity.id,
                fit_processed: activity.fit_processed,
                ...fitData,
            };
        },
    });
}
