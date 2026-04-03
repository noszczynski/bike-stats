import {
    convertLapsForDB,
    convertTrackpointsForDB,
    parseFitFile,
    validateFitFile,
} from "@/lib/fit-parser";
import { prisma } from "@/lib/prisma";

import { calculateHeartRateZonesByTrackpoints } from "@/app/api/trainings/[training_id]/heart-rate-zones-suggestion/route";

export type ProcessFitUserHeartSettings = {
    heart_rate_zone_1_max: number | null;
    heart_rate_zone_2_max: number | null;
    heart_rate_zone_3_max: number | null;
    heart_rate_zone_4_max: number | null;
    heart_rate_zone_5_max: number | null;
};

export type ProcessFitForActivityOptions = {
    trainingId: string;
    buffer: Buffer;
    /** Zapisz powiązanie z Hammerhead po przetworzeniu (jeśli podane). */
    hammerheadActivityId?: string;
};

export type ProcessFitForActivityResult = {
    trackpoints_count: number;
    laps_count: number;
    activity_duration: number;
    activity_distance: number;
    sport: string;
    device: string;
};

/**
 * Parsuje bufor FIT, zapisuje trackpointy i lapy oraz ustawia `fit_processed`.
 * Wykorzystywane przy uploadzie pliku i imporcie z Hammerhead.
 */
export async function processFitForActivity(
    userSettings: ProcessFitUserHeartSettings,
    { trainingId, buffer, hammerheadActivityId }: ProcessFitForActivityOptions,
): Promise<ProcessFitForActivityResult> {
    if (!validateFitFile(buffer)) {
        throw new Error("Invalid FIT file format");
    }

    const parsedFit = await parseFitFile(buffer);

    await prisma.$transaction(async tx => {
        const rawTrackpoints = parsedFit.activity.trackpoints;
        const trackpoints = convertTrackpointsForDB(rawTrackpoints, trainingId);

        if (trackpoints.length > 0) {
            const batchSize = 1000;
            for (let i = 0; i < trackpoints.length; i += batchSize) {
                const batch = trackpoints.slice(i, i + batchSize);
                await tx.trackpoint.createMany({
                    data: batch,
                    skipDuplicates: true,
                });
            }
        }

        const laps = convertLapsForDB(parsedFit.activity.laps, trainingId);

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
                heart_rate_zone_1_max: userSettings.heart_rate_zone_1_max ?? 0,
                heart_rate_zone_2_min: (userSettings.heart_rate_zone_1_max ?? 0) + 1,
                heart_rate_zone_2_max: userSettings.heart_rate_zone_2_max ?? 0,
                heart_rate_zone_3_min: (userSettings.heart_rate_zone_2_max ?? 0) + 1,
                heart_rate_zone_3_max: userSettings.heart_rate_zone_3_max ?? 0,
                heart_rate_zone_4_min: (userSettings.heart_rate_zone_3_max ?? 0) + 1,
                heart_rate_zone_4_max: userSettings.heart_rate_zone_4_max ?? 0,
                heart_rate_zone_5_min: (userSettings.heart_rate_zone_4_max ?? 0) + 1,
                heart_rate_zone_5_max: 300,
            },
        );

        await tx.activity.update({
            where: { id: trainingId },
            data: {
                fit_processed: true,
                heart_rate_zone_1: zones.zone_1.time,
                heart_rate_zone_2: zones.zone_2.time,
                heart_rate_zone_3: zones.zone_3.time,
                heart_rate_zone_4: zones.zone_4.time,
                heart_rate_zone_5: zones.zone_5.time,
                ...(hammerheadActivityId
                    ? { hammerhead_activity_id: hammerheadActivityId }
                    : {}),
            },
        });
    });

    try {
        const { reapplyAutoTagging } = await import("@/features/training/auto-tagging-rules");
        await reapplyAutoTagging(trainingId);
    } catch (error) {
        console.error("Error applying auto-tagging after FIT processing:", error);
    }

    return {
        trackpoints_count: parsedFit.activity.trackpoints.length,
        laps_count: parsedFit.activity.laps.length,
        activity_duration: parsedFit.activity.total_time,
        activity_distance: parsedFit.activity.distance,
        sport: parsedFit.sport,
        device: parsedFit.device,
    };
}
