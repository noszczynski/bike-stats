import type { TrainerLapMetrics } from "@/lib/ai/tools/types";
import { decimalToNumber } from "@/lib/ai/tools/utils";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

function weightedAvgPowerWatts(
    laps: { avg_power_watts: number | null; moving_time_s: number }[],
): number | null {
    const powerLaps = laps.filter(
        lap => lap.avg_power_watts != null && lap.avg_power_watts > 0 && lap.moving_time_s > 0,
    );
    const timeSum = powerLaps.reduce((sum, lap) => sum + lap.moving_time_s, 0);

    if (powerLaps.length === 0 || timeSum <= 0) return null;

    const weighted =
        powerLaps.reduce((sum, lap) => sum + (lap.avg_power_watts ?? 0) * lap.moving_time_s, 0) /
        timeSum;

    return Math.round(weighted);
}

function weightedAvgCadenceRpm(laps: TrainerLapMetrics[]): number | null {
    const cadenceLaps = laps.filter(
        lap => lap.avg_cadence_rpm != null && lap.avg_cadence_rpm > 0 && lap.moving_time_s > 0,
    );
    const timeSum = cadenceLaps.reduce((sum, lap) => sum + lap.moving_time_s, 0);

    if (cadenceLaps.length === 0 || timeSum <= 0) return null;

    const weighted =
        cadenceLaps.reduce((sum, lap) => sum + (lap.avg_cadence_rpm ?? 0) * lap.moving_time_s, 0) /
        timeSum;

    return Math.round(weighted);
}

function weightedAvgHeartRateBpm(laps: TrainerLapMetrics[]): number | null {
    const hrLaps = laps.filter(
        lap =>
            lap.avg_heart_rate_bpm != null && lap.avg_heart_rate_bpm > 0 && lap.moving_time_s > 0,
    );
    const timeSum = hrLaps.reduce((sum, lap) => sum + lap.moving_time_s, 0);

    if (hrLaps.length === 0 || timeSum <= 0) return null;

    const weighted =
        hrLaps.reduce((sum, lap) => sum + (lap.avg_heart_rate_bpm ?? 0) * lap.moving_time_s, 0) /
        timeSum;

    return Math.round(weighted);
}

function maxInt(
    laps: TrainerLapMetrics[],
    key: "max_power_watts" | "max_cadence_rpm" | "max_heart_rate_bpm",
): number | null {
    const values = laps
        .map(lap => lap[key])
        .filter((value): value is number => value != null && value > 0);
    return values.length > 0 ? Math.max(...values) : null;
}

/** Jedna mała paczka liczb z FIT (okrążenia); bez GPS i trackpointów. */
function compactFitSummaryFromLaps(laps: TrainerLapMetrics[]): {
    lap_count: number;
    moving_time_s: number;
    distance_m: number;
    avg_power_watts: number | null;
    max_power_watts: number | null;
    avg_cadence_rpm: number | null;
    max_cadence_rpm: number | null;
    avg_heart_rate_bpm: number | null;
    max_heart_rate_bpm: number | null;
} | null {
    if (laps.length === 0) return null;

    return {
        lap_count: laps.length,
        moving_time_s: laps.reduce((sum, lap) => sum + lap.moving_time_s, 0),
        distance_m: Math.round(laps.reduce((sum, lap) => sum + lap.distance_m, 0)),
        avg_power_watts: weightedAvgPowerWatts(laps),
        max_power_watts: maxInt(laps, "max_power_watts"),
        avg_cadence_rpm: weightedAvgCadenceRpm(laps),
        max_cadence_rpm: maxInt(laps, "max_cadence_rpm"),
        avg_heart_rate_bpm: weightedAvgHeartRateBpm(laps),
        max_heart_rate_bpm: maxInt(laps, "max_heart_rate_bpm"),
    };
}

/** Paczka metryk z FIT bez nulli — mniej tokenów w odpowiedzi toola. */
function leanFitSummary(
    summary: NonNullable<ReturnType<typeof compactFitSummaryFromLaps>>,
    options?: { includeLapTotals?: boolean },
): Record<string, number> | null {
    const includeLapTotals = options?.includeLapTotals ?? false;
    const output: Record<string, number> = {};

    if (summary.lap_count > 0) output.lap_count = summary.lap_count;
    if (includeLapTotals && summary.moving_time_s > 0) output.moving_time_s = summary.moving_time_s;
    if (includeLapTotals && summary.distance_m > 0) output.distance_m = summary.distance_m;
    if (summary.avg_power_watts != null) output.avg_power_watts = summary.avg_power_watts;
    if (summary.max_power_watts != null) output.max_power_watts = summary.max_power_watts;
    if (summary.avg_cadence_rpm != null) output.avg_cadence_rpm = summary.avg_cadence_rpm;
    if (summary.max_cadence_rpm != null) output.max_cadence_rpm = summary.max_cadence_rpm;
    if (summary.avg_heart_rate_bpm != null) output.avg_heart_rate_bpm = summary.avg_heart_rate_bpm;
    if (summary.max_heart_rate_bpm != null) output.max_heart_rate_bpm = summary.max_heart_rate_bpm;

    return Object.keys(output).length > 0 ? output : null;
}

/** Uzupełnia braki po okrążeniach prostymi agregatami z rekordów FIT (1 zapytanie na metrykę). */
async function enrichFitSummaryFromTrackpoints(
    activityId: string,
    summary: NonNullable<ReturnType<typeof compactFitSummaryFromLaps>>,
): Promise<NonNullable<ReturnType<typeof compactFitSummaryFromLaps>>> {
    const needPowerAvg = summary.avg_power_watts == null;
    const needPowerMax = summary.max_power_watts == null;
    const needCadenceAvg = summary.avg_cadence_rpm == null;
    const needCadenceMax = summary.max_cadence_rpm == null;
    const needHrAvg = summary.avg_heart_rate_bpm == null;
    const needHrMax = summary.max_heart_rate_bpm == null;

    if (
        !needPowerAvg &&
        !needPowerMax &&
        !needCadenceAvg &&
        !needCadenceMax &&
        !needHrAvg &&
        !needHrMax
    ) {
        return summary;
    }

    const [powerAgg, cadenceAgg, hrAgg] = await Promise.all([
        needPowerAvg || needPowerMax
            ? prisma.trackpoint.aggregate({
                  where: {
                      activity_id: activityId,
                      power_watts: { not: null, gt: 0 },
                  },
                  ...(needPowerAvg ? { _avg: { power_watts: true } } : {}),
                  ...(needPowerMax ? { _max: { power_watts: true } } : {}),
              })
            : null,
        needCadenceAvg || needCadenceMax
            ? prisma.trackpoint.aggregate({
                  where: {
                      activity_id: activityId,
                      cadence_rpm: { not: null, gt: 0 },
                  },
                  ...(needCadenceAvg ? { _avg: { cadence_rpm: true } } : {}),
                  ...(needCadenceMax ? { _max: { cadence_rpm: true } } : {}),
              })
            : null,
        needHrAvg || needHrMax
            ? prisma.trackpoint.aggregate({
                  where: {
                      activity_id: activityId,
                      heart_rate_bpm: { not: null, gt: 0 },
                  },
                  ...(needHrAvg ? { _avg: { heart_rate_bpm: true } } : {}),
                  ...(needHrMax ? { _max: { heart_rate_bpm: true } } : {}),
              })
            : null,
    ]);

    return {
        ...summary,
        avg_power_watts:
            summary.avg_power_watts ??
            (powerAgg?._avg?.power_watts != null
                ? Math.round(Number(powerAgg._avg.power_watts))
                : null),
        max_power_watts:
            summary.max_power_watts ??
            (powerAgg?._max?.power_watts != null ? powerAgg._max.power_watts : null),
        avg_cadence_rpm:
            summary.avg_cadence_rpm ??
            (cadenceAgg?._avg?.cadence_rpm != null
                ? Math.round(Number(cadenceAgg._avg.cadence_rpm))
                : null),
        max_cadence_rpm:
            summary.max_cadence_rpm ??
            (cadenceAgg?._max?.cadence_rpm != null ? cadenceAgg._max.cadence_rpm : null),
        avg_heart_rate_bpm:
            summary.avg_heart_rate_bpm ??
            (hrAgg?._avg?.heart_rate_bpm != null
                ? Math.round(Number(hrAgg._avg.heart_rate_bpm))
                : null),
        max_heart_rate_bpm:
            summary.max_heart_rate_bpm ??
            (hrAgg?._max?.heart_rate_bpm != null ? hrAgg._max.heart_rate_bpm : null),
    };
}

async function fitSummaryTrackpointsOnly(activityId: string) {
    const [powerAgg, cadenceAgg, hrAgg] = await Promise.all([
        prisma.trackpoint.aggregate({
            where: { activity_id: activityId, power_watts: { not: null, gt: 0 } },
            _avg: { power_watts: true },
            _max: { power_watts: true },
        }),
        prisma.trackpoint.aggregate({
            where: { activity_id: activityId, cadence_rpm: { not: null, gt: 0 } },
            _avg: { cadence_rpm: true },
            _max: { cadence_rpm: true },
        }),
        prisma.trackpoint.aggregate({
            where: { activity_id: activityId, heart_rate_bpm: { not: null, gt: 0 } },
            _avg: { heart_rate_bpm: true },
            _max: { heart_rate_bpm: true },
        }),
    ]);

    const hasAny =
        powerAgg._avg.power_watts != null ||
        cadenceAgg._avg.cadence_rpm != null ||
        hrAgg._avg.heart_rate_bpm != null;

    if (!hasAny) return null;

    return {
        lap_count: 0,
        moving_time_s: 0,
        distance_m: 0,
        avg_power_watts:
            powerAgg._avg.power_watts != null
                ? Math.round(Number(powerAgg._avg.power_watts))
                : null,
        max_power_watts: powerAgg._max.power_watts ?? null,
        avg_cadence_rpm:
            cadenceAgg._avg.cadence_rpm != null
                ? Math.round(Number(cadenceAgg._avg.cadence_rpm))
                : null,
        max_cadence_rpm: cadenceAgg._max.cadence_rpm ?? null,
        avg_heart_rate_bpm:
            hrAgg._avg.heart_rate_bpm != null
                ? Math.round(Number(hrAgg._avg.heart_rate_bpm))
                : null,
        max_heart_rate_bpm: hrAgg._max.heart_rate_bpm ?? null,
    };
}

export function mapLapMetrics(
    laps: Array<{
        moving_time_s: number;
        distance_m: number;
        avg_power_watts: number | null;
        max_power_watts: number | null;
        avg_cadence_rpm: number | null;
        max_cadence_rpm: number | null;
        avg_heart_rate_bpm: number | null;
        max_heart_rate_bpm: number | null;
    }>,
): TrainerLapMetrics[] {
    return laps.map(lap => ({
        moving_time_s: lap.moving_time_s,
        distance_m: lap.distance_m,
        avg_power_watts: lap.avg_power_watts,
        max_power_watts: lap.max_power_watts,
        avg_cadence_rpm: lap.avg_cadence_rpm,
        max_cadence_rpm: lap.max_cadence_rpm,
        avg_heart_rate_bpm: lap.avg_heart_rate_bpm,
        max_heart_rate_bpm: lap.max_heart_rate_bpm,
    }));
}

export async function resolveActivityFitSummary(
    activityId: string,
    fitProcessed: boolean,
    laps: TrainerLapMetrics[],
    options?: { includeLapTotals?: boolean },
) {
    let fitSummary = compactFitSummaryFromLaps(laps);
    let source: "laps" | "trackpoints" | "none" = "none";

    if (fitSummary) {
        fitSummary = await enrichFitSummaryFromTrackpoints(activityId, fitSummary);
        source = "laps";
    } else if (fitProcessed) {
        fitSummary = await fitSummaryTrackpointsOnly(activityId);
        source = fitSummary ? "trackpoints" : "none";
    }

    return {
        fit_summary: fitSummary ? leanFitSummary(fitSummary, options) : null,
        fit_summary_source: source,
    };
}

export function mapRecentActivityItem(activity: {
    id: string;
    type: ActivityType;
    summary: string | null;
    notes: string | null;
    effort: number | null;
    device: string | null;
    created_at: Date;
    fit_processed: boolean;
    strava_activity: {
        name: string;
        date: Date;
        distance_m: number;
        moving_time_s: number;
        elevation_gain_m: number;
        avg_speed_kmh: unknown;
        max_speed_kmh: unknown;
        avg_heart_rate_bpm: number | null;
        max_heart_rate_bpm: number | null;
    } | null;
    activity_tags: Array<{ tag: { name: string } }>;
    laps: TrainerLapMetrics[];
}) {
    const fitFromLaps = compactFitSummaryFromLaps(activity.laps);

    return {
        id: activity.id,
        type: activity.type,
        name: activity.strava_activity?.name ?? null,
        date: activity.strava_activity?.date?.toISOString() ?? activity.created_at.toISOString(),
        distance_m: activity.strava_activity?.distance_m ?? null,
        moving_time_s: activity.strava_activity?.moving_time_s ?? null,
        elevation_gain_m: activity.strava_activity?.elevation_gain_m ?? null,
        avg_speed_kmh: decimalToNumber(activity.strava_activity?.avg_speed_kmh),
        max_speed_kmh: decimalToNumber(activity.strava_activity?.max_speed_kmh),
        avg_heart_rate_bpm: activity.strava_activity?.avg_heart_rate_bpm ?? null,
        max_heart_rate_bpm: activity.strava_activity?.max_heart_rate_bpm ?? null,
        avg_power_watts: weightedAvgPowerWatts(activity.laps),
        fit_from_file:
            fitFromLaps && fitFromLaps.lap_count > 0
                ? leanFitSummary(fitFromLaps, { includeLapTotals: false })
                : null,
        fit_processed: activity.fit_processed,
        summary: activity.summary,
        notes: activity.notes,
        effort: activity.effort,
        device: activity.device,
        tags: activity.activity_tags.map(item => item.tag.name),
    };
}
