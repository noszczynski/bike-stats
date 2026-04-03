import { periodSchema } from "@/lib/ai/tools/constants";
import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { getPeriodSummaryData } from "@/lib/ai/tools/period-summary";
import { deltaNullableNumber, deltaNumber } from "@/lib/ai/tools/utils";
import { ActivityType } from "@prisma/client";
import { z } from "zod";

export function createComparePeriodSummariesTool(userId: string) {
    return createLoggedTool({
        name: "compare_period_summaries",
        description:
            "Porównanie dwóch okresów treningowych. Zwraca dwa summary i deltę najważniejszych metryk, opcjonalnie dla jednego typu aktywności.",
        inputSchema: z.object({
            period_a: periodSchema.describe("Pierwszy okres porównania"),
            period_b: periodSchema.describe("Drugi okres porównania"),
            type: z.nativeEnum(ActivityType).optional(),
        }),
        execute: async input => {
            const [periodA, periodB] = await Promise.all([
                getPeriodSummaryData(userId, {
                    period: input.period_a,
                    type: input.type,
                }),
                getPeriodSummaryData(userId, {
                    period: input.period_b,
                    type: input.type,
                }),
            ]);

            return {
                period_a: periodA,
                period_b: periodB,
                delta_a_minus_b: {
                    activity_count: periodA.activity_count - periodB.activity_count,
                    total_distance_km: deltaNumber(
                        periodA.total_distance_km,
                        periodB.total_distance_km,
                    ),
                    total_moving_hours: deltaNumber(
                        periodA.total_moving_hours,
                        periodB.total_moving_hours,
                    ),
                    avg_distance_km: deltaNumber(periodA.avg_distance_km, periodB.avg_distance_km),
                    avg_moving_hours: deltaNumber(
                        periodA.avg_moving_hours,
                        periodB.avg_moving_hours,
                    ),
                    avg_heart_rate_bpm: deltaNullableNumber(
                        periodA.avg_heart_rate_bpm,
                        periodB.avg_heart_rate_bpm,
                    ),
                    avg_power_watts: deltaNullableNumber(
                        periodA.avg_power_watts,
                        periodB.avg_power_watts,
                    ),
                    activities_with_power_count:
                        periodA.activities_with_power_count - periodB.activities_with_power_count,
                    total_elevation_gain_m:
                        periodA.total_elevation_gain_m - periodB.total_elevation_gain_m,
                },
            };
        },
    });
}
