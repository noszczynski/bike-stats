import { periodSchema } from "@/lib/ai/tools/constants";
import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { getPeriodSummaryData } from "@/lib/ai/tools/period-summary";
import { ActivityType } from "@prisma/client";
import { z } from "zod";

export function createGetPerformanceTrendsTool(userId: string) {
    return createLoggedTool({
        name: "get_performance_trends",
        description:
            "Alias dla get_period_summary. Zostawione dla kompatybilności: zwraca summary za okres, opcjonalnie filtrowane po typie aktywności.",
        inputSchema: z.object({
            period: periodSchema,
            type: z.nativeEnum(ActivityType).optional(),
        }),
        execute: async input => getPeriodSummaryData(userId, input),
    });
}
