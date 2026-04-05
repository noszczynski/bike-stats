import { ACTIVITY_NOT_FOUND_MESSAGE, activityIdSchema } from "@/lib/ai/tools/constants";
import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export function createGetActivityZoneBreakdownTool(userId: string) {
    return createLoggedTool({
        name: "get_activity_zone_breakdown",
        description:
            "Rozkład czasu lub opisu stref tętna zapisany przy aktywności. Nie zwraca progów profilu, tylko breakdown tej sesji.",
        inputSchema: z.object({
            activity_id: activityIdSchema,
        }),
        execute: async input => {
            const activity = await prisma.activity.findFirst({
                where: { id: input.activity_id, user_id: userId },
                select: {
                    id: true,
                    heart_rate_zone_1: true,
                    heart_rate_zone_2: true,
                    heart_rate_zone_3: true,
                    heart_rate_zone_4: true,
                    heart_rate_zone_5: true,
                },
            });

            if (!activity) {
                return { error: ACTIVITY_NOT_FOUND_MESSAGE };
            }

            return {
                activity_id: activity.id,
                zones: {
                    zone_1: activity.heart_rate_zone_1,
                    zone_2: activity.heart_rate_zone_2,
                    zone_3: activity.heart_rate_zone_3,
                    zone_4: activity.heart_rate_zone_4,
                    zone_5: activity.heart_rate_zone_5,
                },
            };
        },
    });
}
