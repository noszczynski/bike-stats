import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { training_id: string } }) {
    try {
        const trainingId = params.training_id;

        // Get the current training
        const currentActivity = await prisma.activity.findUnique({
            where: { id: trainingId },
            include: {
                strava_activity: true,
            },
        });

        if (!currentActivity) {
            return NextResponse.json({ error: "Training not found" }, { status: 404 });
        }

        // Get all activities sorted by date (newest first)
        const allActivities = await prisma.activity.findMany({
            include: {
                strava_activity: true,
            },
            orderBy: { strava_activity: { date: "desc" } },
        });

        // Find current training index
        const currentIndex = allActivities.findIndex(a => a.id === trainingId);

        // Get previous and next trainings
        const prevActivity =
            currentIndex < allActivities.length - 1 ? allActivities[currentIndex + 1] : null;
        const nextActivity = currentIndex > 0 ? allActivities[currentIndex - 1] : null;

        return NextResponse.json({
            current: {
                id: currentActivity.id,
                name: currentActivity.strava_activity.name,
                date: currentActivity.strava_activity.date,
            },
            previous: prevActivity
                ? {
                      id: prevActivity.id,
                      name: prevActivity.strava_activity.name,
                      date: prevActivity.strava_activity.date,
                  }
                : null,
            next: nextActivity
                ? {
                      id: nextActivity.id,
                      name: nextActivity.strava_activity.name,
                      date: nextActivity.strava_activity.date,
                  }
                : null,
        });
    } catch (error) {
        console.error("Error in navigation endpoint:", error);

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
