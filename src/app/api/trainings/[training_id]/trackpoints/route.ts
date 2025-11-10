import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ training_id: string }> },
) {
    try {
        const { training_id } = await params;
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get("limit") || "100000");
        const offset = parseInt(url.searchParams.get("offset") || "0");

        // Check if activity exists
        const activity = await prisma.activity.findUnique({
            where: { id: training_id },
            select: { id: true, fit_processed: true },
        });

        if (!activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        if (!activity.fit_processed) {
            return NextResponse.json(
                { error: "FIT data not processed for this activity" },
                { status: 400 },
            );
        }

        // Get trackpoints with pagination
        const trackpoints = await prisma.trackpoint.findMany({
            where: { activity_id: training_id },
            orderBy: { timestamp: "asc" },
            skip: offset,
            take: limit,
            select: {
                id: true,
                timestamp: true,
                latitude: true,
                longitude: true,
                altitude_m: true,
                distance_m: true,
                speed_ms: true,
                heart_rate_bpm: true,
                cadence_rpm: true,
                power_watts: true,
                temperature_c: true,
            },
        });

        // Get total count for pagination
        const totalCount = await prisma.trackpoint.count({
            where: { activity_id: training_id },
        });

        return NextResponse.json({
            trackpoints,
            pagination: {
                total: totalCount,
                offset,
                limit,
                hasMore: offset + limit < totalCount,
            },
        });
    } catch (error) {
        console.error("Error fetching trackpoints:", error);

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
