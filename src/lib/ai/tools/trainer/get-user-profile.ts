import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export function createGetUserProfileTool(userId: string) {
    return createLoggedTool({
        name: "get_user_profile",
        description:
            "Ustawienia profilu treningowego użytkownika: strefy tętna, wzrost i waga, jeśli są zapisane.",
        inputSchema: z.object({}),
        execute: async () => {
            const settings = await prisma.userSettings.findUnique({
                where: { user_id: userId },
                select: {
                    heart_rate_zone_1_max: true,
                    heart_rate_zone_2_max: true,
                    heart_rate_zone_3_max: true,
                    heart_rate_zone_4_max: true,
                    heart_rate_zone_5_max: true,
                    height_cm: true,
                    weight_kg: true,
                },
            });

            return {
                settings: settings ?? null,
            };
        },
    });
}
