import {
    convertLapsForDB,
    convertTrackpointsForDB,
    parseFitFile,
    validateFitFile,
} from "@/lib/fit-parser";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "../../../../../lib/auth";
import { calculateHeartRateZonesByTrackpoints } from "../heart-rate-zones-suggestion/route";

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

        // Parse FIT file
        let parsedFit;
        try {
            parsedFit = await parseFitFile(buffer);
        } catch (error) {
            console.error("Error parsing FIT file:", error);

            return NextResponse.json({ error: "Failed to parse FIT file" }, { status: 422 });
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

        // Start database transaction to save trackpoints and laps
        await prisma.$transaction(async tx => {
            const rawTrackpoints = parsedFit.activity.trackpoints;

            if (!user || !user.settings) {
                throw new Error("Unauthorized");
            }

            // Convert and insert trackpoints
            const trackpoints = convertTrackpointsForDB(rawTrackpoints, training_id);

            if (trackpoints.length > 0) {
                // Insert trackpoints in batches (1000 at a time to avoid memory issues)
                const batchSize = 1000;
                for (let i = 0; i < trackpoints.length; i += batchSize) {
                    const batch = trackpoints.slice(i, i + batchSize);
                    await tx.trackpoint.createMany({
                        data: batch,
                        skipDuplicates: true,
                    });
                }
            }

            // Convert and insert laps
            const laps = convertLapsForDB(parsedFit.activity.laps, training_id);

            if (laps.length > 0) {
                await tx.lap.createMany({
                    data: laps,
                    skipDuplicates: true,
                });
            }

            const zones = calculateHeartRateZonesByTrackpoints(
                trackpoints.map(tp => ({
                    heart_rate_bpm: tp.heart_rate_bpm ?? null,
                    timestamp: tp.timestamp,
                    speed_ms: tp.speed_ms ?? null,
                    distance_m: tp.distance_m ?? null,
                    latitude: tp.latitude ?? null,
                    longitude: tp.longitude ?? null,
                })),
                {
                    heart_rate_zone_1_min: 0,
                    heart_rate_zone_1_max: user.settings.heart_rate_zone_1_max ?? 0,

                    heart_rate_zone_2_min: (user.settings.heart_rate_zone_1_max ?? 0) + 1,
                    heart_rate_zone_2_max: user.settings.heart_rate_zone_2_max ?? 0,

                    heart_rate_zone_3_min: (user.settings.heart_rate_zone_2_max ?? 0) + 1,
                    heart_rate_zone_3_max: user.settings.heart_rate_zone_3_max ?? 0,

                    heart_rate_zone_4_min: (user.settings.heart_rate_zone_3_max ?? 0) + 1,
                    heart_rate_zone_4_max: user.settings.heart_rate_zone_4_max ?? 0,

                    heart_rate_zone_5_min: (user.settings.heart_rate_zone_4_max ?? 0) + 1,
                    heart_rate_zone_5_max: 300,
                },
            );

            console.log("zones:", zones);

            // Mark activity as FIT processed
            await tx.activity.update({
                where: { id: training_id },
                data: {
                    fit_processed: true,
                    heart_rate_zone_1: zones.zone_1.time,
                    heart_rate_zone_2: zones.zone_2.time,
                    heart_rate_zone_3: zones.zone_3.time,
                    heart_rate_zone_4: zones.zone_4.time,
                    heart_rate_zone_5: zones.zone_5.time,
                },
            });
        });

        // Apply auto-tagging after FIT processing (now we have detailed data)
        try {
            const { reapplyAutoTagging } = await import("@/features/training/auto-tagging-rules");
            await reapplyAutoTagging(training_id);
        } catch (error) {
            console.error("Error applying auto-tagging after FIT processing:", error);
            // Don't fail the FIT processing if auto-tagging fails
        }

        // Return success response with summary
        return NextResponse.json({
            success: true,
            message: "FIT file processed successfully",
            data: {
                trackpoints_count: parsedFit.activity.trackpoints.length,
                laps_count: parsedFit.activity.laps.length,
                activity_duration: parsedFit.activity.total_time,
                activity_distance: parsedFit.activity.distance,
                sport: parsedFit.sport,
                device: parsedFit.device,
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
                data: { fit_processed: false },
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
