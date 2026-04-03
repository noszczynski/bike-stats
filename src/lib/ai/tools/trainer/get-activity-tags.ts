import { ACTIVITY_NOT_FOUND_MESSAGE, activityIdSchema } from "@/lib/ai/tools/constants";
import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export function createGetActivityTagsTool(userId: string) {
    return createLoggedTool({
        name: "get_activity_tags",
        description:
            "Tagi przypisane do aktywności wraz z informacją, czy są auto-generowane czy dodane ręcznie.",
        inputSchema: z.object({
            activity_id: activityIdSchema,
        }),
        execute: async input => {
            const activity = await prisma.activity.findFirst({
                where: { id: input.activity_id, user_id: userId },
                select: {
                    id: true,
                    activity_tags: {
                        select: {
                            is_auto_generated: true,
                            tag: {
                                select: {
                                    name: true,
                                    description: true,
                                    color: true,
                                    icon: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!activity) {
                return { error: ACTIVITY_NOT_FOUND_MESSAGE };
            }

            return {
                activity_id: activity.id,
                tag_count: activity.activity_tags.length,
                tags: activity.activity_tags.map(item => ({
                    name: item.tag.name,
                    description: item.tag.description,
                    color: item.tag.color,
                    icon: item.tag.icon,
                    is_auto_generated: item.is_auto_generated,
                })),
            };
        },
    });
}
