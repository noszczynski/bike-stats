import { periodSchema } from "@/lib/ai/tools/constants";
import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { getPeriodSummaryData } from "@/lib/ai/tools/period-summary";
import { ActivityType } from "@prisma/client";
import { z } from "zod";

export function createGetPeriodSummaryTool(userId: string) {
    return createLoggedTool({
        name: "get_period_summary",
        description:
            "Zagregowane statystyki za okres 7d/30d/90d/1y, opcjonalnie dla jednego typu aktywności: liczba treningów, dystans, czas, HR, moc i breakdown po typach.",
        inputSchema: z.object({
            period: periodSchema,
            type: z.nativeEnum(ActivityType).optional(),
        }),
        execute: async input => getPeriodSummaryData(userId, input),
    });
}
