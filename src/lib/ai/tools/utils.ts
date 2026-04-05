import { ISO_DATE_ONLY, periodSchema } from "@/lib/ai/tools/constants";
import { Prisma } from "@prisma/client";
import { z } from "zod";

/** Północ…koniec dnia UTC dla samej daty YYYY-MM-DD — inaczej from===to daje tylko jedną chwilę i nic nie trafia. */
export function parseActivityDateBounds(
    dateFrom?: string,
    dateTo?: string,
): { from?: Date; to?: Date } {
    let from: Date | undefined;
    let to: Date | undefined;

    if (dateFrom) {
        from = ISO_DATE_ONLY.test(dateFrom)
            ? new Date(`${dateFrom}T00:00:00.000Z`)
            : new Date(dateFrom);
    }

    if (dateTo) {
        to = ISO_DATE_ONLY.test(dateTo) ? new Date(`${dateTo}T23:59:59.999Z`) : new Date(dateTo);
    }

    return { from, to };
}

export function decimalToNumber(value: unknown): number | null {
    return value == null ? null : Number(value);
}

export function roundOneDecimal(value: number): number {
    return Math.round((value + Number.EPSILON) * 10) / 10;
}

export function periodToStartDate(period: z.infer<typeof periodSchema>): Date {
    const days = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 } as const;
    return new Date(Date.now() - days[period] * 24 * 60 * 60 * 1000);
}

export function activityDateWhere(from?: Date, to?: Date): Prisma.ActivityWhereInput | undefined {
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

export function deltaNumber(current: number, previous: number) {
    return roundOneDecimal(current - previous);
}

export function deltaNullableNumber(current: number | null, previous: number | null) {
    if (current == null || previous == null) return null;
    return roundOneDecimal(current - previous);
}
