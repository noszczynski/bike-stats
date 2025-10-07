import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { round } from "lodash";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const generateLapsSchema = z.object({
    distance_km: z.number().min(0.1).max(50), // Distance in kilometers for each lap
});

export async function POST(
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

        // Parse request body
        const body = await request.json();
        const { distance_km } = generateLapsSchema.parse(body);
        const targetDistanceM = distance_km * 1000; // Convert to meters

        // Check if activity exists and belongs to the user
        const activity = await prisma.activity.findUnique({
            where: {
                id: training_id,
                user_id: user.id,
            },
            select: { id: true, fit_processed: true },
        });

        if (!activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        if (!activity.fit_processed) {
            return NextResponse.json(
                { error: "No trackpoints data available. Please upload FIT file first." },
                { status: 400 },
            );
        }

        const lapsCount = await prisma.lap.count({
            where: { activity_id: training_id },
        });

        if (lapsCount > 0) {
            await prisma.lap.deleteMany({
                where: { activity_id: training_id },
            });
        }

        // Get trackpoints sorted by timestamp
        const trackpoints = await prisma.trackpoint.findMany({
            where: {
                activity_id: training_id,
                distance_m: { not: null },
            },
            orderBy: { timestamp: "asc" },
            select: {
                id: true,
                timestamp: true,
                distance_m: true,
                speed_ms: true,
                heart_rate_bpm: true,
                cadence_rpm: true,
                altitude_m: true,
                latitude: true,
                longitude: true,
            },
        });

        if (trackpoints.length === 0) {
            return NextResponse.json(
                { error: "No trackpoints found for this activity" },
                { status: 404 },
            );
        }

        // Debug: Check trackpoints data
        console.log("Total trackpoints:", trackpoints.length);
        console.log("First trackpoint:", trackpoints[0]);
        console.log("Last trackpoint:", trackpoints[trackpoints.length - 1]);

        // Check if distance_m is populated
        const trackpointsWithDistance = trackpoints.filter(
            tp => tp.distance_m !== null && tp.distance_m !== undefined,
        );
        console.log("Trackpoints with distance:", trackpointsWithDistance.length);

        if (trackpointsWithDistance.length === 0) {
            return NextResponse.json(
                {
                    error: "No trackpoints with distance data found. Distance field may not be populated.",
                },
                { status: 400 },
            );
        }

        // Helper function to calculate lap statistics
        const calculateLapStats = (lapTrackpoints: typeof trackpoints) => {
            if (lapTrackpoints.length === 0) return null;

            const lapStart = lapTrackpoints[0];
            const lapEnd = lapTrackpoints[lapTrackpoints.length - 1];

            // Calculate duration
            const lapDuration =
                (new Date(lapEnd.timestamp).getTime() - new Date(lapStart.timestamp).getTime()) /
                1000;

            // Calculate distance
            const startDistance = lapStart.distance_m || 0;
            const endDistance = lapEnd.distance_m || 0;
            const lapDistance = endDistance - startDistance;

            // Calculate average speed (m/s)
            const speedValues = lapTrackpoints
                .filter(tp => tp.speed_ms !== null)
                .map(tp => tp.speed_ms!);
            const avgSpeed =
                speedValues.length > 0
                    ? speedValues.reduce((a, b) => a + b, 0) / speedValues.length
                    : null;
            const maxSpeed = speedValues.length > 0 ? Math.max(...speedValues) : null;

            // Calculate average heart rate
            const hrValues = lapTrackpoints
                .filter(tp => tp.heart_rate_bpm !== null)
                .map(tp => tp.heart_rate_bpm!);
            const avgHeartRate =
                hrValues.length > 0
                    ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length)
                    : null;
            const maxHeartRate = hrValues.length > 0 ? Math.max(...hrValues) : null;

            // Calculate average cadence
            const cadenceValues = lapTrackpoints
                .filter(tp => tp.cadence_rpm !== null)
                .map(tp => tp.cadence_rpm!);
            const avgCadence =
                cadenceValues.length > 0
                    ? Math.round(cadenceValues.reduce((a, b) => a + b, 0) / cadenceValues.length)
                    : null;
            const maxCadence = cadenceValues.length > 0 ? Math.max(...cadenceValues) : null;

            // Calculate elevation gain
            const altitudeValues = lapTrackpoints
                .filter(tp => tp.altitude_m !== null)
                .map(tp => tp.altitude_m!);
            let elevationGain = 0;
            if (altitudeValues.length > 1) {
                for (let j = 1; j < altitudeValues.length; j++) {
                    const gain = altitudeValues[j] - altitudeValues[j - 1];
                    if (gain > 0) elevationGain += gain;
                }
            }

            return {
                start_time: new Date(lapStart.timestamp),
                end_time: new Date(lapEnd.timestamp),
                distance_m: lapDistance > 0 ? round(lapDistance, 2) : 0,
                moving_time_s: round(lapDuration),
                elapsed_time_s: round(lapDuration),
                avg_speed_ms: avgSpeed ? round(avgSpeed, 2) : null,
                max_speed_ms: maxSpeed ? round(maxSpeed, 2) : null,
                avg_heart_rate_bpm: avgHeartRate,
                max_heart_rate_bpm: maxHeartRate,
                avg_cadence_rpm: avgCadence,
                max_cadence_rpm: maxCadence,
                total_elevation_gain_m: elevationGain > 0 ? round(elevationGain, 2) : null,
                start_latitude: lapStart.latitude ? round(lapStart.latitude, 6) : null,
                start_longitude: lapStart.longitude ? round(lapStart.longitude, 6) : null,
                end_latitude: lapEnd.latitude ? round(lapEnd.latitude, 6) : null,
                end_longitude: lapEnd.longitude ? round(lapEnd.longitude, 6) : null,
            };
        };

        // Generate laps by grouping trackpoints by distance
        const laps = [];
        let currentLapNumber = 1;
        let lapStartIndex = 0;
        let lapStartDistance = trackpoints[0].distance_m || 0;

        console.log("Starting lap generation with lapStartDistance:", lapStartDistance);

        for (let i = 1; i < trackpoints.length; i++) {
            const currentDistance = trackpoints[i].distance_m || 0;
            const lapDistance = currentDistance - lapStartDistance;

            // Check if we've reached the target distance for this lap
            if (lapDistance >= targetDistanceM) {
                console.log(
                    `Creating lap ${currentLapNumber}: lapDistance=${lapDistance}, targetDistance=${targetDistanceM}`,
                );

                // Get trackpoints for this lap
                const lapTrackpoints = trackpoints.slice(lapStartIndex, i + 1);
                const lapStats = calculateLapStats(lapTrackpoints);

                if (lapStats) {
                    const lap = {
                        activity_id: training_id,
                        lap_number: currentLapNumber,
                        ...lapStats,
                    };
                    laps.push(lap);
                }

                // Move to next lap
                currentLapNumber++;
                lapStartIndex = i;
                lapStartDistance = currentDistance;
            }
        }

        // Handle remaining trackpoints as final lap
        if (lapStartIndex < trackpoints.length - 1) {
            const remainingTrackpoints = trackpoints.slice(lapStartIndex);
            const remainingDistance =
                (trackpoints[trackpoints.length - 1].distance_m || 0) - lapStartDistance;

            console.log(`Creating final lap with distance: ${remainingDistance}`);

            const lapStats = calculateLapStats(remainingTrackpoints);
            if (lapStats) {
                const finalLap = {
                    activity_id: training_id,
                    lap_number: currentLapNumber,
                    ...lapStats,
                };
                laps.push(finalLap);
            }
        }

        console.log(`Total laps generated: ${laps.length}`);

        if (laps.length === 0) {
            return NextResponse.json(
                { error: "Unable to generate laps. Training distance may be too short." },
                { status: 400 },
            );
        }

        // Delete existing generated laps for this activity
        await prisma.lap.deleteMany({
            where: { activity_id: training_id },
        });

        // Insert new laps
        await prisma.lap.createMany({
            data: laps,
            skipDuplicates: true,
        });

        // Fetch the created laps to return
        const createdLaps = await prisma.lap.findMany({
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
            success: true,
            message: `Generated ${createdLaps.length} laps`,
            laps: createdLaps,
            lap_distance_km: distance_km,
        });
    } catch (error) {
        console.error("Error generating laps:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid request data", details: error.errors },
                { status: 400 },
            );
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
