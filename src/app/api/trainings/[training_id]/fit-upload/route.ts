import { validateFitFile } from "@/lib/fit-parser";
import { processFitForActivity } from "@/lib/process-fit-for-activity";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "../../../../../lib/auth";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ training_id: string }> },
) {
    try {
        const { training_id } = await params;

        // Check if activity exists
        const activity = await prisma.activity.findUnique({
            where: { id: training_id },
            select: { id: true, fit_processed: true },
        });

        if (!activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        if (activity.fit_processed) {
            return NextResponse.json(
                { error: "FIT file already processed for this activity" },
                { status: 409 },
            );
        }

        // Get uploaded file from FormData
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith(".fit")) {
            return NextResponse.json({ error: "File must be a .FIT file" }, { status: 400 });
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Validate FIT file format
        if (!validateFitFile(buffer)) {
            return NextResponse.json({ error: "Invalid FIT file format" }, { status: 400 });
        }

        const user = await getAuthenticatedUser({
            id: true,
            email: true,
            settings: {
                select: {
                    heart_rate_zone_1_max: true,
                    heart_rate_zone_2_max: true,
                    heart_rate_zone_3_max: true,
                    heart_rate_zone_4_max: true,
                    heart_rate_zone_5_max: true,
                },
            },
        });

        if (!user || !user.settings) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let summary;
        try {
            summary = await processFitForActivity(user.settings, {
                trainingId: training_id,
                buffer,
            });
        } catch (error) {
            console.error("Error parsing FIT file:", error);

            return NextResponse.json({ error: "Failed to parse FIT file" }, { status: 422 });
        }

        // Return success response with summary
        return NextResponse.json({
            success: true,
            message: "FIT file processed successfully",
            data: {
                trackpoints_count: summary.trackpoints_count,
                laps_count: summary.laps_count,
                activity_duration: summary.activity_duration,
                activity_distance: summary.activity_distance,
                sport: summary.sport,
                device: summary.device,
            },
        });
    } catch (error) {
        console.error("Error processing FIT file:", error);

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ training_id: string }> },
) {
    try {
        const { training_id } = await params;

        // Get activity with FIT processing status
        const activity = await prisma.activity.findUnique({
            where: { id: training_id },
            select: {
                id: true,
                fit_processed: true,
                _count: {
                    select: {
                        trackpoints: true,
                        laps: true,
                    },
                },
            },
        });

        if (!activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        return NextResponse.json({
            fit_processed: activity.fit_processed,
            trackpoints_count: activity._count.trackpoints,
            laps_count: activity._count.laps,
        });
    } catch (error) {
        console.error("Error getting FIT status:", error);

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
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
            select: {
                id: true,
                fit_processed: true,
                _count: {
                    select: {
                        trackpoints: true,
                        laps: true,
                    },
                },
            },
        });

        if (!activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        if (!activity.fit_processed) {
            return NextResponse.json({ error: "No FIT data to remove" }, { status: 400 });
        }

        // Delete all trackpoints and laps for this activity using transaction
        const result = await prisma.$transaction(async tx => {
            const [deletedTrackpoints, deletedLaps] = await Promise.all([
                tx.trackpoint.deleteMany({
                    where: { activity_id: training_id },
                }),
                tx.lap.deleteMany({
                    where: { activity_id: training_id },
                }),
            ]);

            // Set fit_processed to false
            await tx.activity.update({
                where: { id: training_id },
                data: { fit_processed: false, hammerhead_activity_id: null },
            });

            return {
                trackpoints: deletedTrackpoints.count,
                laps: deletedLaps.count,
            };
        });

        return NextResponse.json({
            success: true,
            message: "FIT data removed successfully",
            deleted: result,
        });
    } catch (error) {
        console.error("Error removing FIT data:", error);

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
