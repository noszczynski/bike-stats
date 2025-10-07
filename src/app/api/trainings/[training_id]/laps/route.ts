import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ training_id: string }> },
) {
    try {
        const { training_id } = await params;

        // Check if user is authenticated
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if activity exists and belongs to the user
        const activity = await prisma.activity.findUnique({
            where: {
                id: training_id,
                user_id: user.id,
            },
            select: { id: true },
        });

        if (!activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        // Get laps for this activity
        const laps = await prisma.lap.findMany({
            where: { activity_id: training_id },
            orderBy: { lap_number: "asc" },
            select: {
                id: true,
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
                avg_cadence_rpm: true,
                max_cadence_rpm: true,
                total_elevation_gain_m: true,
                start_latitude: true,
                start_longitude: true,
                end_latitude: true,
                end_longitude: true,
                created_at: true,
            },
        });

        return NextResponse.json({
            laps,
            count: laps.length,
        });
    } catch (error) {
        console.error("Error fetching laps:", error);

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
