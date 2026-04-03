import { prisma } from "@/lib/prisma";
import { ActivityType, Prisma } from "@prisma/client";
import { tool } from "ai";
import { z } from "zod";

const periodSchema = z.enum(["7d", "30d", "90d", "1y"]);
const activityIdSchema = z.string().uuid();

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const TOOL_COLORS = {
    reset: "\x1b[0m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    dim: "\x1b[2m",
} as const;
const ACTIVITY_NOT_FOUND_MESSAGE = "Aktywność nie istnieje lub nie należy do użytkownika.";

type TrainerLapMetrics = {
    moving_time_s: number;
    distance_m: number;
    avg_power_watts: number | null;
    max_power_watts: number | null;
    avg_cadence_rpm: number | null;
    max_cadence_rpm: number | null;
    avg_heart_rate_bpm: number | null;
    max_heart_rate_bpm: number | null;
};

function serializeToolInput(input: unknown): string {
    try {
        return JSON.stringify(input ?? {}, null, 2);
    } catch {
        return '"[unserializable input]"';
    }
}

function logToolStart(name: string, input: unknown) {
    console.info(
        `${TOOL_COLORS.cyan}[AI tool]${TOOL_COLORS.reset} ${TOOL_COLORS.yellow}${name}${TOOL_COLORS.reset} ${TOOL_COLORS.dim}input:${TOOL_COLORS.reset} ${serializeToolInput(input)}`,
    );
}

function logToolSuccess(name: string) {
    console.info(
        `${TOOL_COLORS.cyan}[AI tool]${TOOL_COLORS.reset} ${TOOL_COLORS.green}${name}${TOOL_COLORS.reset} dane zostaly pobrane.`,
    );
}

function logToolFailure(name: string, error: unknown) {
    console.error(
        `${TOOL_COLORS.cyan}[AI tool]${TOOL_COLORS.reset} ${TOOL_COLORS.red}${name}${TOOL_COLORS.reset} blad podczas pobierania danych.`,
        error,
    );
}

function createLoggedTool<TInputSchema extends z.ZodTypeAny, TResult>({
    name,
    description,
    inputSchema,
    execute,
}: {
    name: string;
    description: string;
    inputSchema: TInputSchema;
    execute: (input: z.infer<TInputSchema>) => Promise<TResult>;
}) {
    return tool({
        description,
        inputSchema: inputSchema as never,
        execute: (async (input: unknown) => {
            logToolStart(name, input);

            try {
                const result = await execute(input as z.infer<TInputSchema>);
                logToolSuccess(name);
                return result;
            } catch (error) {
                logToolFailure(name, error);
                throw error;
            }
        }) as never,
    });
}

/** Północ…koniec dnia UTC dla samej daty YYYY-MM-DD — inaczej from===to daje tylko jedną chwilę i nic nie trafia. */
function parseActivityDateBounds(dateFrom?: string, dateTo?: string): { from?: Date; to?: Date } {
    let from: Date | undefined;
    let to: Date | undefined;

    if (dateFrom) {
        from = ISO_DATE_ONLY.test(dateFrom)
            ? new Date(`${dateFrom}T00:00:00.000Z`)
            : new Date(dateFrom);
    }

    if (dateTo) {
        to = ISO_DATE_ONLY.test(dateTo)
            ? new Date(`${dateTo}T23:59:59.999Z`)
            : new Date(dateTo);
    }

    return { from, to };
}

function decimalToNumber(value: unknown): number | null {
    return value == null ? null : Number(value);
}

function roundOneDecimal(value: number): number {
    return Math.round((value + Number.EPSILON) * 10) / 10;
}

function weightedAvgPowerWatts(
    laps: { avg_power_watts: number | null; moving_time_s: number }[],
): number | null {
    const powerLaps = laps.filter(
        lap => lap.avg_power_watts != null && lap.avg_power_watts > 0 && lap.moving_time_s > 0,
    );
    const timeSum = powerLaps.reduce((sum, lap) => sum + lap.moving_time_s, 0);

    if (powerLaps.length === 0 || timeSum <= 0) return null;

    const weighted =
        powerLaps.reduce(
            (sum, lap) => sum + (lap.avg_power_watts ?? 0) * lap.moving_time_s,
            0,
        ) / timeSum;

    return Math.round(weighted);
}

function weightedAvgCadenceRpm(laps: TrainerLapMetrics[]): number | null {
    const cadenceLaps = laps.filter(
        lap => lap.avg_cadence_rpm != null && lap.avg_cadence_rpm > 0 && lap.moving_time_s > 0,
    );
    const timeSum = cadenceLaps.reduce((sum, lap) => sum + lap.moving_time_s, 0);

    if (cadenceLaps.length === 0 || timeSum <= 0) return null;

    const weighted =
        cadenceLaps.reduce(
            (sum, lap) => sum + (lap.avg_cadence_rpm ?? 0) * lap.moving_time_s,
            0,
        ) / timeSum;

    return Math.round(weighted);
}

function weightedAvgHeartRateBpm(laps: TrainerLapMetrics[]): number | null {
    const hrLaps = laps.filter(
        lap =>
            lap.avg_heart_rate_bpm != null &&
            lap.avg_heart_rate_bpm > 0 &&
            lap.moving_time_s > 0,
    );
    const timeSum = hrLaps.reduce((sum, lap) => sum + lap.moving_time_s, 0);

    if (hrLaps.length === 0 || timeSum <= 0) return null;

    const weighted =
        hrLaps.reduce(
            (sum, lap) => sum + (lap.avg_heart_rate_bpm ?? 0) * lap.moving_time_s,
            0,
        ) / timeSum;

    return Math.round(weighted);
}

function maxInt(
    laps: TrainerLapMetrics[],
    key: "max_power_watts" | "max_cadence_rpm" | "max_heart_rate_bpm",
): number | null {
    const values = laps.map(lap => lap[key]).filter((value): value is number => value != null && value > 0);
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
            (powerAgg?._avg?.power_watts != null ? Math.round(Number(powerAgg._avg.power_watts)) : null),
        max_power_watts:
            summary.max_power_watts ?? (powerAgg?._max?.power_watts != null ? powerAgg._max.power_watts : null),
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
            powerAgg._avg.power_watts != null ? Math.round(Number(powerAgg._avg.power_watts)) : null,
        max_power_watts: powerAgg._max.power_watts ?? null,
        avg_cadence_rpm:
            cadenceAgg._avg.cadence_rpm != null ? Math.round(Number(cadenceAgg._avg.cadence_rpm)) : null,
        max_cadence_rpm: cadenceAgg._max.cadence_rpm ?? null,
        avg_heart_rate_bpm:
            hrAgg._avg.heart_rate_bpm != null ? Math.round(Number(hrAgg._avg.heart_rate_bpm)) : null,
        max_heart_rate_bpm: hrAgg._max.heart_rate_bpm ?? null,
    };
}

function periodToStartDate(period: z.infer<typeof periodSchema>): Date {
    const days = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 } as const;
    return new Date(Date.now() - days[period] * 24 * 60 * 60 * 1000);
}

function activityDateWhere(from?: Date, to?: Date): Prisma.ActivityWhereInput | undefined {
    if (!from && !to) return undefined;

    const dateRange = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
    };

    return {
        OR: [
            {
                strava_activity: {
                    is: { date: dateRange },
                },
            },
            {
                AND: [{ strava_activity_id: null }, { created_at: dateRange }],
            },
        ],
    };
}

function mapLapMetrics(
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

function mapStravaActivity(
    strava:
        | {
              name: string;
              date: Date;
              distance_m: number;
              moving_time_s: number;
              elevation_gain_m: number;
              avg_speed_kmh: unknown;
              max_speed_kmh: unknown;
              avg_heart_rate_bpm?: number | null;
              max_heart_rate_bpm?: number | null;
          }
        | null
        | undefined,
) {
    if (!strava) return null;

    return {
        ...strava,
        avg_speed_kmh: decimalToNumber(strava.avg_speed_kmh),
        max_speed_kmh: decimalToNumber(strava.max_speed_kmh),
        avg_heart_rate_bpm: strava.avg_heart_rate_bpm ?? null,
        max_heart_rate_bpm: strava.max_heart_rate_bpm ?? null,
    };
}

function mapRecentActivityItem(activity: {
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

async function resolveActivityFitSummary(
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

async function getOwnedActivityId(userId: string, activityId: string) {
    return prisma.activity.findFirst({
        where: { id: activityId, user_id: userId },
        select: { id: true },
    });
}

async function getPeriodSummaryData(
    userId: string,
    input: { period: z.infer<typeof periodSchema>; type?: ActivityType },
) {
    const since = periodToStartDate(input.period);
    const sinceWhere = activityDateWhere(since);

    const activities = await prisma.activity.findMany({
        where: {
            user_id: userId,
            ...(input.type ? { type: input.type } : {}),
            ...(sinceWhere ?? {}),
        },
        select: {
            type: true,
            strava_activity: {
                select: {
                    distance_m: true,
                    moving_time_s: true,
                    avg_heart_rate_bpm: true,
                    elevation_gain_m: true,
                },
            },
            laps: {
                select: {
                    avg_power_watts: true,
                    moving_time_s: true,
                },
            },
        },
        take: 2000,
    });

    const byType: Record<string, number> = {};
    let totalDistanceM = 0;
    let totalMovingS = 0;
    let totalElevationM = 0;
    let hrSum = 0;
    let hrCount = 0;
    let powerWeightedSum = 0;
    let powerMovingS = 0;
    let activitiesWithPower = 0;

    for (const activity of activities) {
        byType[activity.type] = (byType[activity.type] ?? 0) + 1;

        if (activity.strava_activity) {
            totalDistanceM += activity.strava_activity.distance_m;
            totalMovingS += activity.strava_activity.moving_time_s;
            totalElevationM += activity.strava_activity.elevation_gain_m;

            if (activity.strava_activity.avg_heart_rate_bpm != null) {
                hrSum += activity.strava_activity.avg_heart_rate_bpm;
                hrCount++;
            }
        }

        let hasPowerInActivity = false;

        for (const lap of activity.laps) {
            if (lap.avg_power_watts != null && lap.avg_power_watts > 0 && lap.moving_time_s > 0) {
                powerWeightedSum += lap.avg_power_watts * lap.moving_time_s;
                powerMovingS += lap.moving_time_s;
                hasPowerInActivity = true;
            }
        }

        if (hasPowerInActivity) activitiesWithPower++;
    }

    const activityCount = activities.length;
    const totalDistanceKm = roundOneDecimal(totalDistanceM / 1000);
    const totalMovingHours = roundOneDecimal(totalMovingS / 3600);

    return {
        period: input.period,
        since: since.toISOString(),
        filter_type: input.type ?? null,
        activity_count: activityCount,
        total_distance_km: totalDistanceKm,
        total_moving_hours: totalMovingHours,
        avg_distance_km: activityCount > 0 ? roundOneDecimal(totalDistanceKm / activityCount) : 0,
        avg_moving_hours: activityCount > 0 ? roundOneDecimal(totalMovingHours / activityCount) : 0,
        avg_heart_rate_bpm: hrCount > 0 ? Math.round(hrSum / hrCount) : null,
        avg_power_watts: powerMovingS > 0 ? Math.round(powerWeightedSum / powerMovingS) : null,
        activities_with_power_count: activitiesWithPower,
        total_elevation_gain_m: totalElevationM,
        by_type: byType,
    };
}

function deltaNumber(current: number, previous: number) {
    return roundOneDecimal(current - previous);
}

function deltaNullableNumber(current: number | null, previous: number | null) {
    if (current == null || previous == null) return null;
    return roundOneDecimal(current - previous);
}

export function createTrainerTools(userId: string) {
    return {
        get_recent_activities: createLoggedTool({
            name: "get_recent_activities",
            description:
                "Lista ostatnich aktywności użytkownika z filtrami. Zwraca lekki przegląd: metadane, tagi, podstawowe liczby Strava i mały fit_from_file z laps, gdy dostępny.",
            inputSchema: z.object({
                limit: z.number().int().min(1).max(50).optional().describe("Domyślnie 20, max 50"),
                type: z.nativeEnum(ActivityType).optional(),
                date_from: z
                    .string()
                    .optional()
                    .describe("Początek zakresu dat w ISO 8601 lub YYYY-MM-DD"),
                date_to: z
                    .string()
                    .optional()
                    .describe("Koniec zakresu dat w ISO 8601 lub YYYY-MM-DD"),
                has_fit_file: z
                    .boolean()
                    .optional()
                    .describe("true: tylko aktywności z przetworzonym FIT, false: bez FIT"),
                has_power_data: z
                    .boolean()
                    .optional()
                    .describe("true: tylko aktywności z danymi mocy w laps, false: bez takich danych"),
            }),
            execute: async input => {
                const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
                const { from, to } = parseActivityDateBounds(input.date_from, input.date_to);
                const datePart = activityDateWhere(from, to);

                const activities = await prisma.activity.findMany({
                    where: {
                        user_id: userId,
                        ...(input.type ? { type: input.type } : {}),
                        ...(datePart ?? {}),
                        ...(input.has_fit_file != null ? { fit_processed: input.has_fit_file } : {}),
                        ...(input.has_power_data === true
                            ? {
                                  laps: {
                                      some: {
                                          avg_power_watts: { gt: 0 },
                                      },
                                  },
                              }
                            : {}),
                        ...(input.has_power_data === false
                            ? {
                                  laps: {
                                      none: {
                                          avg_power_watts: { gt: 0 },
                                      },
                                  },
                              }
                            : {}),
                    },
                    orderBy: [{ created_at: "desc" }],
                    take: limit,
                    select: {
                        id: true,
                        type: true,
                        summary: true,
                        notes: true,
                        effort: true,
                        device: true,
                        created_at: true,
                        fit_processed: true,
                        strava_activity: {
                            select: {
                                name: true,
                                date: true,
                                distance_m: true,
                                moving_time_s: true,
                                elevation_gain_m: true,
                                avg_speed_kmh: true,
                                max_speed_kmh: true,
                                avg_heart_rate_bpm: true,
                                max_heart_rate_bpm: true,
                            },
                        },
                        activity_tags: {
                            select: {
                                tag: { select: { name: true } },
                            },
                        },
                        laps: {
                            select: {
                                avg_power_watts: true,
                                max_power_watts: true,
                                moving_time_s: true,
                                distance_m: true,
                                avg_cadence_rpm: true,
                                max_cadence_rpm: true,
                                avg_heart_rate_bpm: true,
                                max_heart_rate_bpm: true,
                            },
                        },
                    },
                });

                return {
                    count: activities.length,
                    filters: {
                        type: input.type ?? null,
                        date_from: input.date_from ?? null,
                        date_to: input.date_to ?? null,
                        has_fit_file: input.has_fit_file ?? null,
                        has_power_data: input.has_power_data ?? null,
                    },
                    activities: activities.map(activity =>
                        mapRecentActivityItem({
                            ...activity,
                            laps: mapLapMetrics(activity.laps),
                        }),
                    ),
                };
            },
        }),

        get_activity_overview: createLoggedTool({
            name: "get_activity_overview",
            description:
                "Zwięzły przegląd jednej aktywności: metadane, liczby Strava, opis użytkownika i liczniki powiązanych danych (laps, trackpoints, tags).",
            inputSchema: z.object({
                activity_id: activityIdSchema,
            }),
            execute: async input => {
                const activity = await prisma.activity.findFirst({
                    where: { id: input.activity_id, user_id: userId },
                    select: {
                        id: true,
                        type: true,
                        summary: true,
                        notes: true,
                        effort: true,
                        device: true,
                        battery_percent_usage: true,
                        fit_processed: true,
                        created_at: true,
                        strava_activity: {
                            select: {
                                name: true,
                                date: true,
                                distance_m: true,
                                moving_time_s: true,
                                elevation_gain_m: true,
                                avg_speed_kmh: true,
                                max_speed_kmh: true,
                                avg_heart_rate_bpm: true,
                                max_heart_rate_bpm: true,
                            },
                        },
                        _count: {
                            select: {
                                laps: true,
                                trackpoints: true,
                                activity_tags: true,
                            },
                        },
                    },
                });

                if (!activity) {
                    return { error: ACTIVITY_NOT_FOUND_MESSAGE };
                }

                return {
                    id: activity.id,
                    type: activity.type,
                    name: activity.strava_activity?.name ?? null,
                    date: activity.strava_activity?.date?.toISOString() ?? activity.created_at.toISOString(),
                    summary: activity.summary,
                    notes: activity.notes,
                    effort: activity.effort,
                    device: activity.device,
                    battery_percent_usage: activity.battery_percent_usage,
                    fit_processed: activity.fit_processed,
                    strava_activity: mapStravaActivity(activity.strava_activity),
                    lap_count: activity._count.laps,
                    trackpoint_count: activity._count.trackpoints,
                    tag_count: activity._count.activity_tags,
                };
            },
        }),

        get_activity_fit_summary: createLoggedTool({
            name: "get_activity_fit_summary",
            description:
                "Zwarte metryki z pliku FIT dla jednej aktywności: lap_count, moc, kadencja, tętno i ewentualne uzupełnienie z trackpointów.",
            inputSchema: z.object({
                activity_id: activityIdSchema,
                include_totals: z
                    .boolean()
                    .optional()
                    .describe("Czy zwrócić też total distance i moving time z agregacji FIT"),
            }),
            execute: async input => {
                const activity = await prisma.activity.findFirst({
                    where: { id: input.activity_id, user_id: userId },
                    select: {
                        id: true,
                        fit_processed: true,
                        laps: {
                            select: {
                                moving_time_s: true,
                                distance_m: true,
                                avg_power_watts: true,
                                max_power_watts: true,
                                avg_cadence_rpm: true,
                                max_cadence_rpm: true,
                                avg_heart_rate_bpm: true,
                                max_heart_rate_bpm: true,
                            },
                        },
                    },
                });

                if (!activity) {
                    return { error: ACTIVITY_NOT_FOUND_MESSAGE };
                }

                const fitData = await resolveActivityFitSummary(
                    activity.id,
                    activity.fit_processed,
                    mapLapMetrics(activity.laps),
                    { includeLapTotals: input.include_totals ?? false },
                );

                return {
                    activity_id: activity.id,
                    fit_processed: activity.fit_processed,
                    ...fitData,
                };
            },
        }),

        get_activity_laps: createLoggedTool({
            name: "get_activity_laps",
            description:
                "Lista okrążeń jednej aktywności. Przydatne do analizy interwałów, spadków mocy, tętna i zmienności tempa.",
            inputSchema: z.object({
                activity_id: activityIdSchema,
                limit: z.number().int().min(1).max(200).optional().describe("Domyślnie 50, max 200"),
            }),
            execute: async input => {
                const activity = await getOwnedActivityId(userId, input.activity_id);

                if (!activity) {
                    return { error: ACTIVITY_NOT_FOUND_MESSAGE };
                }

                const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
                const laps = await prisma.lap.findMany({
                    where: { activity_id: input.activity_id },
                    orderBy: { lap_number: "asc" },
                    take: limit,
                    select: {
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
                        avg_power_watts: true,
                        max_power_watts: true,
                        avg_cadence_rpm: true,
                        max_cadence_rpm: true,
                        total_elevation_gain_m: true,
                    },
                });

                return {
                    activity_id: input.activity_id,
                    returned_lap_count: laps.length,
                    laps,
                };
            },
        }),

        get_activity_tags: createLoggedTool({
            name: "get_activity_tags",
            description:
                "Tagi przypisane do aktywności wraz z informacją, czy są auto-generowane czy dodane ręcznie.",
            inputSchema: z.object({
                activity_id: activityIdSchema,
            }),
            execute: async input => {
                const activity = await prisma.activity.findFirst({
                    where: { id: input.activity_id, user_id: userId },
                    select: {
                        id: true,
                        activity_tags: {
                            select: {
                                is_auto_generated: true,
                                tag: {
                                    select: {
                                        name: true,
                                        description: true,
                                        color: true,
                                        icon: true,
                                    },
                                },
                            },
                        },
                    },
                });

                if (!activity) {
                    return { error: ACTIVITY_NOT_FOUND_MESSAGE };
                }

                return {
                    activity_id: activity.id,
                    tag_count: activity.activity_tags.length,
                    tags: activity.activity_tags.map(item => ({
                        name: item.tag.name,
                        description: item.tag.description,
                        color: item.tag.color,
                        icon: item.tag.icon,
                        is_auto_generated: item.is_auto_generated,
                    })),
                };
            },
        }),

        get_activity_zone_breakdown: createLoggedTool({
            name: "get_activity_zone_breakdown",
            description:
                "Rozkład czasu lub opisu stref tętna zapisany przy aktywności. Nie zwraca progów profilu, tylko breakdown tej sesji.",
            inputSchema: z.object({
                activity_id: activityIdSchema,
            }),
            execute: async input => {
                const activity = await prisma.activity.findFirst({
                    where: { id: input.activity_id, user_id: userId },
                    select: {
                        id: true,
                        heart_rate_zone_1: true,
                        heart_rate_zone_2: true,
                        heart_rate_zone_3: true,
                        heart_rate_zone_4: true,
                        heart_rate_zone_5: true,
                    },
                });

                if (!activity) {
                    return { error: ACTIVITY_NOT_FOUND_MESSAGE };
                }

                return {
                    activity_id: activity.id,
                    zones: {
                        zone_1: activity.heart_rate_zone_1,
                        zone_2: activity.heart_rate_zone_2,
                        zone_3: activity.heart_rate_zone_3,
                        zone_4: activity.heart_rate_zone_4,
                        zone_5: activity.heart_rate_zone_5,
                    },
                };
            },
        }),

        get_activity_sensor_summary: createLoggedTool({
            name: "get_activity_sensor_summary",
            description:
                "Dostępność danych sensorów i gęstość próbek dla aktywności: HR, kadencja, moc, GPS, temperatura oraz liczba laps/trackpoints.",
            inputSchema: z.object({
                activity_id: activityIdSchema,
            }),
            execute: async input => {
                const activity = await prisma.activity.findFirst({
                    where: { id: input.activity_id, user_id: userId },
                    select: {
                        id: true,
                        fit_processed: true,
                        _count: {
                            select: {
                                laps: true,
                                trackpoints: true,
                            },
                        },
                    },
                });

                if (!activity) {
                    return { error: ACTIVITY_NOT_FOUND_MESSAGE };
                }

                const [heartRatePoints, cadencePoints, powerPoints, gpsPoints, temperaturePoints] =
                    await Promise.all([
                        prisma.trackpoint.count({
                            where: { activity_id: input.activity_id, heart_rate_bpm: { not: null } },
                        }),
                        prisma.trackpoint.count({
                            where: { activity_id: input.activity_id, cadence_rpm: { not: null } },
                        }),
                        prisma.trackpoint.count({
                            where: { activity_id: input.activity_id, power_watts: { not: null } },
                        }),
                        prisma.trackpoint.count({
                            where: {
                                activity_id: input.activity_id,
                                latitude: { not: null },
                                longitude: { not: null },
                            },
                        }),
                        prisma.trackpoint.count({
                            where: { activity_id: input.activity_id, temperature_c: { not: null } },
                        }),
                    ]);

                return {
                    activity_id: activity.id,
                    fit_processed: activity.fit_processed,
                    lap_count: activity._count.laps,
                    trackpoint_count: activity._count.trackpoints,
                    sensors: {
                        heart_rate_points: heartRatePoints,
                        cadence_points: cadencePoints,
                        power_points: powerPoints,
                        gps_points: gpsPoints,
                        temperature_points: temperaturePoints,
                        has_heart_rate: heartRatePoints > 0,
                        has_cadence: cadencePoints > 0,
                        has_power: powerPoints > 0,
                        has_gps: gpsPoints > 0,
                        has_temperature: temperaturePoints > 0,
                    },
                };
            },
        }),

        get_activity_details: createLoggedTool({
            name: "get_activity_details",
            description:
                "Pełniejszy snapshot jednej aktywności: overview + tagi + strefy HR + fit_summary. Używaj, gdy potrzebny jest jeden szeroki widok zamiast kilku mniejszych tooli.",
            inputSchema: z.object({
                activity_id: activityIdSchema,
                include_full_laps: z
                    .boolean()
                    .optional()
                    .describe("Domyślnie false — bez pełnej tablicy okrążeń"),
            }),
            execute: async input => {
                const activity = await prisma.activity.findFirst({
                    where: { id: input.activity_id, user_id: userId },
                    select: {
                        id: true,
                        type: true,
                        summary: true,
                        notes: true,
                        effort: true,
                        device: true,
                        battery_percent_usage: true,
                        fit_processed: true,
                        created_at: true,
                        heart_rate_zone_1: true,
                        heart_rate_zone_2: true,
                        heart_rate_zone_3: true,
                        heart_rate_zone_4: true,
                        heart_rate_zone_5: true,
                        strava_activity: {
                            select: {
                                name: true,
                                date: true,
                                distance_m: true,
                                moving_time_s: true,
                                elevation_gain_m: true,
                                avg_speed_kmh: true,
                                max_speed_kmh: true,
                                avg_heart_rate_bpm: true,
                                max_heart_rate_bpm: true,
                            },
                        },
                        laps: {
                            orderBy: { lap_number: "asc" },
                            select: {
                                lap_number: true,
                                distance_m: true,
                                moving_time_s: true,
                                avg_speed_ms: true,
                                max_speed_ms: true,
                                avg_heart_rate_bpm: true,
                                max_heart_rate_bpm: true,
                                avg_power_watts: true,
                                max_power_watts: true,
                                avg_cadence_rpm: true,
                                max_cadence_rpm: true,
                                total_elevation_gain_m: true,
                            },
                        },
                        activity_tags: {
                            select: {
                                tag: {
                                    select: {
                                        name: true,
                                        description: true,
                                        color: true,
                                        icon: true,
                                    },
                                },
                                is_auto_generated: true,
                            },
                        },
                        _count: {
                            select: {
                                laps: true,
                                trackpoints: true,
                                activity_tags: true,
                            },
                        },
                    },
                });

                if (!activity) {
                    return { error: ACTIVITY_NOT_FOUND_MESSAGE };
                }

                const fitData = await resolveActivityFitSummary(
                    activity.id,
                    activity.fit_processed,
                    mapLapMetrics(activity.laps),
                    { includeLapTotals: true },
                );

                return {
                    id: activity.id,
                    type: activity.type,
                    summary: activity.summary,
                    notes: activity.notes,
                    effort: activity.effort,
                    device: activity.device,
                    battery_percent_usage: activity.battery_percent_usage,
                    fit_processed: activity.fit_processed,
                    created_at: activity.created_at.toISOString(),
                    strava_activity: mapStravaActivity(activity.strava_activity),
                    counts: {
                        laps: activity._count.laps,
                        trackpoints: activity._count.trackpoints,
                        tags: activity._count.activity_tags,
                    },
                    zones: {
                        zone_1: activity.heart_rate_zone_1,
                        zone_2: activity.heart_rate_zone_2,
                        zone_3: activity.heart_rate_zone_3,
                        zone_4: activity.heart_rate_zone_4,
                        zone_5: activity.heart_rate_zone_5,
                    },
                    tags: activity.activity_tags.map(item => ({
                        name: item.tag.name,
                        description: item.tag.description,
                        color: item.tag.color,
                        icon: item.tag.icon,
                        is_auto_generated: item.is_auto_generated,
                    })),
                    ...fitData,
                    ...(input.include_full_laps === true ? { laps: activity.laps } : {}),
                };
            },
        }),

        get_user_profile: createLoggedTool({
            name: "get_user_profile",
            description:
                "Ustawienia profilu treningowego użytkownika: strefy tętna, wzrost i waga, jeśli są zapisane.",
            inputSchema: z.object({}),
            execute: async () => {
                const settings = await prisma.userSettings.findUnique({
                    where: { user_id: userId },
                    select: {
                        heart_rate_zone_1_max: true,
                        heart_rate_zone_2_max: true,
                        heart_rate_zone_3_max: true,
                        heart_rate_zone_4_max: true,
                        heart_rate_zone_5_max: true,
                        height_cm: true,
                        weight_kg: true,
                    },
                });

                return {
                    settings: settings ?? null,
                };
            },
        }),

        get_period_summary: createLoggedTool({
            name: "get_period_summary",
            description:
                "Zagregowane statystyki za okres 7d/30d/90d/1y, opcjonalnie dla jednego typu aktywności: liczba treningów, dystans, czas, HR, moc i breakdown po typach.",
            inputSchema: z.object({
                period: periodSchema,
                type: z.nativeEnum(ActivityType).optional(),
            }),
            execute: async input => getPeriodSummaryData(userId, input),
        }),

        compare_period_summaries: createLoggedTool({
            name: "compare_period_summaries",
            description:
                "Porównanie dwóch okresów treningowych. Zwraca dwa summary i deltę najważniejszych metryk, opcjonalnie dla jednego typu aktywności.",
            inputSchema: z.object({
                period_a: periodSchema.describe("Pierwszy okres porównania"),
                period_b: periodSchema.describe("Drugi okres porównania"),
                type: z.nativeEnum(ActivityType).optional(),
            }),
            execute: async input => {
                const [periodA, periodB] = await Promise.all([
                    getPeriodSummaryData(userId, {
                        period: input.period_a,
                        type: input.type,
                    }),
                    getPeriodSummaryData(userId, {
                        period: input.period_b,
                        type: input.type,
                    }),
                ]);

                return {
                    period_a: periodA,
                    period_b: periodB,
                    delta_a_minus_b: {
                        activity_count: periodA.activity_count - periodB.activity_count,
                        total_distance_km: deltaNumber(periodA.total_distance_km, periodB.total_distance_km),
                        total_moving_hours: deltaNumber(periodA.total_moving_hours, periodB.total_moving_hours),
                        avg_distance_km: deltaNumber(periodA.avg_distance_km, periodB.avg_distance_km),
                        avg_moving_hours: deltaNumber(periodA.avg_moving_hours, periodB.avg_moving_hours),
                        avg_heart_rate_bpm: deltaNullableNumber(
                            periodA.avg_heart_rate_bpm,
                            periodB.avg_heart_rate_bpm,
                        ),
                        avg_power_watts: deltaNullableNumber(
                            periodA.avg_power_watts,
                            periodB.avg_power_watts,
                        ),
                        activities_with_power_count:
                            periodA.activities_with_power_count - periodB.activities_with_power_count,
                        total_elevation_gain_m:
                            periodA.total_elevation_gain_m - periodB.total_elevation_gain_m,
                    },
                };
            },
        }),

        get_performance_trends: createLoggedTool({
            name: "get_performance_trends",
            description:
                "Alias dla get_period_summary. Zostawione dla kompatybilności: zwraca summary za okres, opcjonalnie filtrowane po typie aktywności.",
            inputSchema: z.object({
                period: periodSchema,
                type: z.nativeEnum(ActivityType).optional(),
            }),
            execute: async input => getPeriodSummaryData(userId, input),
        }),
    };
}
