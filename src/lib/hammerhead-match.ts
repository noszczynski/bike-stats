import type { HammerheadActivityListItem } from "@/types/hammerhead";
import dayjs from "dayjs";

export function sameCalendarDay(isoStartedAt: string | null, trainingYmd: string): boolean {
    if (!isoStartedAt) return false;
    const d = dayjs(isoStartedAt);
    if (!d.isValid()) return false;
    return d.format("YYYY-MM-DD") === trainingYmd;
}

/** Dzień treningu ± 1 pełny dzień kalendarzowy (wg lokalnej strefy) — do listy dopasowań Hammerhead. */
export function isWithinHammerheadMatchWindow(
    isoStartedAt: string | null,
    trainingYmd: string,
): boolean {
    if (!isoStartedAt) return false;
    const started = dayjs(isoStartedAt);
    const trainingDay = dayjs(trainingYmd, "YYYY-MM-DD");
    if (!started.isValid() || !trainingDay.isValid()) return false;
    const ymd = started.format("YYYY-MM-DD");
    const min = trainingDay.subtract(1, "day").format("YYYY-MM-DD");
    const max = trainingDay.add(1, "day").format("YYYY-MM-DD");
    return ymd >= min && ymd <= max;
}

/** 0–100, wyżej = lepsze dopasowanie dystansu (po metrach). */
export function distanceMatchPercent(activityMeters: number, referenceMeters: number): number {
    if (referenceMeters <= 0 && activityMeters <= 0) return 100;
    if (referenceMeters <= 0) return 50;
    const rel = Math.abs(activityMeters - referenceMeters) / referenceMeters;
    return Math.max(0, Math.round((1 - Math.min(1, rel)) * 100));
}

export type HammerheadSuggestion = {
    suggestedId: string | null;
    ranked: { item: HammerheadActivityListItem; score: number; sameDay: boolean }[];
};

/**
 * Jedyna aktywność Hammerhead w danym dniu → zawsze sugerowana.
 * W przeciwnym razie najlepsze dopasowanie po dystansie (tylko z tego samego dnia).
 */
export function suggestHammerheadActivity(
    items: HammerheadActivityListItem[],
    trainingDateYmd: string,
    trainingDistanceMeters: number,
): HammerheadSuggestion {
    const sameDayItems = items.filter(i => sameCalendarDay(i.startedAt, trainingDateYmd));

    if (sameDayItems.length === 1) {
        const only = sameDayItems[0];
        return {
            suggestedId: only.id,
            ranked: items.map(item => ({
                item,
                score:
                    item.id === only.id
                        ? 100
                        : distanceMatchPercent(item.distanceMeters, trainingDistanceMeters),
                sameDay: sameCalendarDay(item.startedAt, trainingDateYmd),
            })),
        };
    }

    if (sameDayItems.length > 1) {
        const rankedSame = sameDayItems
            .map(item => ({
                item,
                score: distanceMatchPercent(item.distanceMeters, trainingDistanceMeters),
                sameDay: true as const,
            }))
            .sort((a, b) => b.score - a.score);
        const suggestedId =
            rankedSame[0] && rankedSame[0].score >= 35 ? rankedSame[0].item.id : null;

        const ranked = items.map(item => {
            const sd = sameCalendarDay(item.startedAt, trainingDateYmd);
            return {
                item,
                score: sd
                    ? distanceMatchPercent(item.distanceMeters, trainingDistanceMeters)
                    : distanceMatchPercent(item.distanceMeters, trainingDistanceMeters) * 0.25,
                sameDay: sd,
            };
        });
        ranked.sort((a, b) => b.score - a.score);

        return { suggestedId, ranked };
    }

    const ranked = items.map(item => ({
        item,
        score: distanceMatchPercent(item.distanceMeters, trainingDistanceMeters) * 0.25,
        sameDay: false as const,
    }));
    ranked.sort((a, b) => b.score - a.score);

    return { suggestedId: null, ranked };
}
