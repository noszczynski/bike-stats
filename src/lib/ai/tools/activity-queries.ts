import { prisma } from "@/lib/prisma";

export async function getOwnedActivityId(userId: string, activityId: string) {
    return prisma.activity.findFirst({
        where: { id: activityId, user_id: userId },
        select: { id: true },
    });
}
