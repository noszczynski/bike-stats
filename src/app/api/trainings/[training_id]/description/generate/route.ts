import { calculateAverageHeartRate } from "@/features/training/calculate-average-heart-rate";
import { calculateAverageSpeed } from "@/features/training/calculate-average-speed";
import { calculateAverageTimePerKm } from "@/features/training/calculate-average-time-per-km";
import { calculateElevationGainPerKm } from "@/features/training/calculate-elevation-gain-per-km";
import { calculateHighestAverageHeartRate } from "@/features/training/calculate-highest-average-heart-rate";
import { calculateHighestAverageSpeed } from "@/features/training/calculate-highest-average-speed";
import { calculateHighestDistance } from "@/features/training/calculate-highest-distance";
import { calculateMaxSpeed } from "@/features/training/calculate-max-speed";
import { calculateShortestTimePerKm } from "@/features/training/calculate-shortest-time-per-km";
import { calculateTotalDistance } from "@/features/training/calculate-total-distance";
import { calculateTotalElevationGain } from "@/features/training/calculate-total-elevation-gain";
import { completion } from "@/lib/api/openai";
import { getActivity } from "@/lib/api/strava";
import { getAllTrainings, updateTraining } from "@/lib/api/trainings";
import { getAuthenticatedUser } from "@/lib/auth";
import date from "@/lib/date";
import { prisma } from "@/lib/prisma";
import dayjs from "dayjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Helper function to get training with laps and trackpoints
async function getTrainingWithDetails(trainingId: string) {
    const activity = await prisma.activity.findUnique({
        where: { id: trainingId },
        select: {
            strava_activity: true,
            strava_activity_id: true,
            heart_rate_zone_1: true,
            heart_rate_zone_2: true,
            heart_rate_zone_3: true,
            heart_rate_zone_4: true,
            heart_rate_zone_5: true,
            effort: true,
            notes: true,
            laps: {
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
                },
            },
            trackpoints: {
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
                    temperature_c: true,
                },
                // Order by timestamp to get chronological data
                orderBy: {
                    timestamp: "asc",
                },
            },
        },
    });

    if (!activity) {
        return null;
    }

    return {
        ...activity,
        // Filter out trackpoints with null values for HR and cadence if they're consistently null
        trackpoints: activity.trackpoints.filter(
            tp => tp.heart_rate_bpm !== null || tp.cadence_rpm !== null || tp.speed_ms !== null,
        ),
    };
}

export async function POST(request: Request, { params }: { params: { training_id: string } }) {
    try {
        // Add authentication
        const user = await getAuthenticatedUser({
            id: true,
            settings: {
                select: {
                    weight_kg: true,
                    height_cm: true,
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const training = await getTrainingWithDetails(params.training_id);

        if (!training || !training.strava_activity) {
            return NextResponse.json({ error: "Training not found" }, { status: 404 });
        }

        const cookieStore = await cookies();

        const accessToken = cookieStore.get("strava_access_token")?.value;
        const refreshToken = cookieStore.get("strava_refresh_token")?.value;

        if (!accessToken || !refreshToken) {
            return NextResponse.json(
                { error: "No access token or refresh token found" },
                { status: 401 },
            );
        }

        // Calculate date range for last two months
        const currentTrainingDate = dayjs(training.strava_activity.date);
        const twoMonthsAgo = currentTrainingDate.subtract(2, "month").startOf("day");
        const currentTrainingEndOfDay = currentTrainingDate.endOf("day");

        // Get trainings from last two months for comparison
        const { trainings: lastTwoMonthsTrainings } = await getAllTrainings({
            startDate: twoMonthsAgo.format("YYYY-MM-DD"),
            endDate: currentTrainingEndOfDay.format("YYYY-MM-DD"),
        });

        const stravaActivity = await getActivity(
            Number(training.strava_activity_id),
            accessToken,
            refreshToken,
        );

        const averageSpeed = calculateAverageSpeed(lastTwoMonthsTrainings);
        const highestAverageSpeed = calculateHighestAverageSpeed(lastTwoMonthsTrainings);
        const maxSpeed = calculateMaxSpeed(lastTwoMonthsTrainings);
        const averageHeartRate = calculateAverageHeartRate(lastTwoMonthsTrainings);
        const highestAverageHeartRate = calculateHighestAverageHeartRate(lastTwoMonthsTrainings);
        const totalDistance = calculateTotalDistance(lastTwoMonthsTrainings);
        const highestDistance = calculateHighestDistance(lastTwoMonthsTrainings);
        const elevationGainPerKm = calculateElevationGainPerKm(lastTwoMonthsTrainings);
        const totalElevationGain = calculateTotalElevationGain(lastTwoMonthsTrainings);
        const averageTimePerKm = calculateAverageTimePerKm(lastTwoMonthsTrainings);
        const shortestTimePerKm = calculateShortestTimePerKm(lastTwoMonthsTrainings);

        const currentElevationPerKm =
            training.strava_activity.elevation_gain_m /
            (training.strava_activity.distance_m / 1000);

        // Format laps data for prompt
        const lapsData = training.laps.map(lap => ({
            lap_number: lap.lap_number,
            distance_km: (lap.distance_m / 1000).toFixed(2),
            moving_time_s: lap.moving_time_s,
            avg_speed_kmh: lap.avg_speed_ms ? (lap.avg_speed_ms * 3.6).toFixed(1) : null,
            max_speed_kmh: lap.max_speed_ms ? (lap.max_speed_ms * 3.6).toFixed(1) : null,
            avg_heart_rate_bpm: lap.avg_heart_rate_bpm,
            max_heart_rate_bpm: lap.max_heart_rate_bpm,
            elevation_gain_m: lap.total_elevation_gain_m
                ? lap.total_elevation_gain_m.toFixed(1)
                : null,
        }));

        // Format trackpoints data for prompt - sample every 150th point to reduce size
        const sampledTrackpoints = training.trackpoints
            .filter((_, index) => index % 150 === 0)
            .map(tp => ({
                timestamp: tp.timestamp,
                distance_m: tp.distance_m,
                speed_kmh: tp.speed_ms ? (tp.speed_ms * 3.6).toFixed(1) : null,
                heart_rate_bpm: tp.heart_rate_bpm,
                altitude_m: tp.altitude_m ? tp.altitude_m.toFixed(1) : null,
            }));

        const userWeight = user.settings?.weight_kg || 71;
        const userHeight = user.settings?.height_cm || 185;

        // Construct heart rate zones object
        const heartRateZones = {
            zone_1: training.heart_rate_zone_1,
            zone_2: training.heart_rate_zone_2,
            zone_3: training.heart_rate_zone_3,
            zone_4: training.heart_rate_zone_4,
            zone_5: training.heart_rate_zone_5,
        };

        const prompt = `Generate a concise, insightful training summary in Polish based on the following data. Focus on interesting findings and unique aspects of this specific ride.

Training Data:

\`\`\`training_data
Weight: ${userWeight}kg;
Height: ${userHeight}cm;
Sex: Male;
Age: ${date().year() - 1999};
Date: ${training.strava_activity.date};
Distance: ${(training.strava_activity.distance_m / 1000).toFixed(2) || "N/A"} km;
Moving Time (seconds): ${training.strava_activity.moving_time_s || "N/A"};
Moving Time (hours): ${(training.strava_activity.moving_time_s / 3600).toFixed(2) || "N/A"};
Average Speed: ${training.strava_activity.avg_speed_kmh || "N/A"} km/h;
Max Speed: ${training.strava_activity.max_speed_kmh || "N/A"} km/h;
Elevation Gain: ${training.strava_activity.elevation_gain_m || "N/A"} m;
Elevation per km: ${currentElevationPerKm.toFixed(1) || "N/A"} m/km;
Average Heart Rate: ${training.strava_activity.avg_heart_rate_bpm || "N/A"} bpm;
Max Heart Rate: ${training.strava_activity.max_heart_rate_bpm || "N/A"} bpm;
Heart Rate Zones: ${JSON.stringify(heartRateZones)};
Effort Level (subjective assessment): ${training.effort || "N/A"}/10;
${training.notes ? `Athlete Notes: ${training.notes};` : ""}
\`\`\`

Laps Data:

\`\`\`laps_data
${lapsData
    .map(
        lap => `Lap ${lap.lap_number}:
- Distance: ${lap.distance_km} km;
- Moving Time: ${lap.moving_time_s}s;
- Average Speed: ${lap.avg_speed_kmh || "N/A"} km/h;
- Max Speed: ${lap.max_speed_kmh || "N/A"} km/h
- Average Heart Rate: ${lap.avg_heart_rate_bpm || "N/A"} bpm
- Max Heart Rate: ${lap.max_heart_rate_bpm || "N/A"} bpm;
- Elevation Gain: ${lap.elevation_gain_m || "N/A"} m`,
    )
    .join("; \n\n")}
\`\`\`

Trackpoints Sample:

\`\`\`trackpoints_sample
${sampledTrackpoints
    .slice(0, 50)
    .map(
        tp =>
            `Time: ${date(tp.timestamp).format("YYYY-MM-DD HH:mm:ss")} | Distance: ${tp.distance_m || "N/A"}m | Speed: ${tp.speed_kmh || "N/A"} km/h | HR: ${tp.heart_rate_bpm || "N/A"} bpm | Altitude: ${tp.altitude_m || "N/A"}m`,
    )
    .join(";\n")}
\`\`\`

Strava source data:

\`\`\`strava_activity_data
Name: "${stravaActivity.name}";
Type: ${stravaActivity.type};
Achievement Count: ${stravaActivity.achievement_count || 0};
Workout Type: ${stravaActivity.workout_type || "N/A"};
Calories: ${stravaActivity.calories || "N/A"};
\`\`\`

Historical Metrics (Last 2 months):

\`\`\`historical_metrics_last_2_months
Average Speed: ${averageSpeed.toFixed(1)} km/h;
Highest Average Speed: ${highestAverageSpeed.toFixed(1)} km/h;
Highest Recorded Speed: ${maxSpeed.toFixed(1)} km/h;
Average Heart Rate: ${averageHeartRate.toFixed(0)} bpm;
Highest Average Heart Rate: ${highestAverageHeartRate} bpm;
Total Distance Cycled: ${totalDistance.toFixed(0)} km;
Longest Ride Distance: ${highestDistance.toFixed(1)} km;
Average Elevation Gain per km: ${elevationGainPerKm.toFixed(1)} m/km;
Total Elevation Climbed: ${totalElevationGain.toFixed(0)} m;
Average Pace: ${averageTimePerKm};
Fastest Pace: ${shortestTimePerKm};
\`\`\`

Recent trainings from last 2 months:

\`\`\`recent_trainings_last_2_months
${lastTwoMonthsTrainings
    .slice(0, 8)
    .map(
        t => `Training "${t.name}" (${date(t.date).format("YYYY-MM-DD")}):
- Distance: ${t.distance_km} km;
- Moving Time: ${t.moving_time}s;
- Average Speed: ${t.avg_speed_kmh} km/h;
- Max Speed: ${t.max_speed_kmh} km/h;
- Elevation Gain: ${t.elevation_gain_m} m;
- Average Heart Rate: ${t.avg_heart_rate_bpm || "N/A"} bpm;
- Effort Level: ${t.effort || "N/A"}/10`,
    )
    .join("; \n\n")}
\`\`\`

CRITICAL GUIDELINES:
- **Keep it SHORT**: Aim for 250-400 words maximum
- **Find the story**: Look for interesting patterns, unusual data points, or notable achievements in the laps and trackpoints
- **Vary your language**: Each summary should feel fresh and unique - avoid repetitive phrases
- **Be specific**: Reference actual lap numbers, specific moments, or unusual heart rate/speed patterns
- **Skip the obvious**: Don't just restate numbers - provide insights and context
- **Conversational tone**: Write like a knowledgeable training buddy, not a robot

Example Response Structure (adapt creatively, don't copy):

\`\`\`example_response_markdown
## "${stravaActivity.name}" - September 9, 2025

Your **79.9 km** ride in **3h 14min** averaged **24.8 km/h** - noticeably faster than your recent 2-month average of 23.2 km/h. What's interesting is you managed this despite **606m elevation** (7.6 m/km), well above your usual 5.5 m/km profile. The subjective effort of 6/10 suggests your climbing fitness is improving.

### What Stands Out

**The good stuff:**
- Laps 8-9 were exceptionally strong at **32.4 km/h** and **30.3 km/h** - you actually got faster mid-ride
- Heart rate stayed remarkably consistent in zones 3-4 (nearly 3 hours total) without erratic spikes
- Your max speed of **59.8 km/h** shows confident descending technique

**Worth noting:**
- Laps 7, 11, 12 had the toughest climbs (62-89m each) - speed naturally dropped but you maintained 21+ km/h
- Zone 5 barely activated - if you're targeting VO2max gains, consider adding short intervals
- Final kilometers showed slight fatigue (about 1.5 km/h slower) - pacing strategy could extend that strong mid-ride performance

The standout detail: you sustained zone 3-4 intensity for over 2.5 hours on challenging terrain while maintaining speed above your historical average. That's solid endurance development. Keep this consistency and your PRs are within reach.
\`\`\`

STRUCTURE:
1. **Main heading (##)**: Training name and date
2. **Opening paragraph**: 2-3 sentences with key stats and one interesting observation
3. **Section "What Stands Out" (###)**: Split into "The good stuff" and "Worth noting" with 2-4 concise bullet points each
4. **Closing**: 1-2 sentences with a unique insight or encouragement

OUTPUT REQUIREMENTS:
- Use Markdown: ## for title, ### for section
- Bold key numbers and interesting findings
- Keep bullet points to one line
- Total: 250-400 words
- Language: Polish
- Tone: Analytical yet encouraging
- Translate lap as "odcinek" in Polish

IMPORTANT: Analyze the lap-by-lap data for interesting patterns - fastest/slowest laps, heart rate variations, elevation challenges, pacing strategy. Make each summary feel personalized and insightful, not templated.`;

        const summary = await completion(prompt);

        const updatedTraining = await updateTraining(params.training_id, { summary });

        return NextResponse.json({ training: updatedTraining });
    } catch (error) {
        console.error("Generate summary error:", error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: "Internal server error", details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
