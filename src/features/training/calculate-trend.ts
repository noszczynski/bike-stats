import date from "@/lib/date";

import { Training } from "../../types/training";

/**
 * Calculates the trend percentage between recent and older period values
 *
 * @param trainings All training data
 * @param valueFn Function to extract the value to analyze from each training
 * @param recentPeriodMonths Number of months to consider as "recent" period
 * @param olderPeriodMonths Number of months to consider as "older" period for comparison
 * @param customCalculator Optional custom function to calculate trend with direct access to filtered periods
 * @returns Trend percentage (positive for increase, negative for decrease)
 */
export const calculateTrend = (
    trainings: Training[],
    valueFn: (training: Training) => number,
    recentPeriodMonths = 3,
    olderPeriodMonths = 3,
    customCalculator?: (recentTrainings: Training[], olderTrainings: Training[]) => number,
): number => {
    if (trainings.length === 0) return 0;

    // Sort trainings by date
    const sortedTrainings = [...trainings].sort(
        (a, b) => date(b.date).valueOf() - date(a.date).valueOf(),
    );

    const now = date();
    const recentPeriodStart = now.subtract(recentPeriodMonths, "month");
    const olderPeriodStart = recentPeriodStart.subtract(olderPeriodMonths, "month");

    // Filter trainings for recent and older periods
    const recentTrainings = sortedTrainings.filter(
        t => date(t.date).isAfter(recentPeriodStart) || date(t.date).isSame(recentPeriodStart),
    );

    const olderTrainings = sortedTrainings.filter(
        t =>
            (date(t.date).isAfter(olderPeriodStart) || date(t.date).isSame(olderPeriodStart)) &&
            date(t.date).isBefore(recentPeriodStart),
    );

    // If a custom calculator was provided, use it
    if (customCalculator) {
        return customCalculator(recentTrainings, olderTrainings);
    }

    // Calculate average values for each period
    const calculateAverage = (items: Training[]): number => {
        if (items.length === 0) return 0;
        const sum = items.reduce((total, item) => total + valueFn(item), 0);

        return sum / items.length;
    };

    const recentAvg = calculateAverage(recentTrainings);
    const olderAvg = calculateAverage(olderTrainings);

    // Calculate trend percentage
    if (olderAvg === 0) return recentAvg > 0 ? 100 : 0;

    return ((recentAvg - olderAvg) / olderAvg) * 100;
};

/**
 * Returns an appropriate trend message based on the calculated trend percentage
 *
 * @param trend The calculated trend percentage
 * @param positiveIsBetter Whether a positive trend is an improvement
 * @returns A human-readable trend message
 */
export const getTrendMessage = (trend: number, positiveIsBetter = true): string => {
    const absValue = Math.abs(trend);
    const isPositive = trend > 0;
    const isImprovement = (positiveIsBetter && isPositive) || (!positiveIsBetter && !isPositive);

    if (absValue === 0) return "Bez zmian";

    if (absValue < 2) {
        return isImprovement ? "Niewielka poprawa" : "Niewielki spadek";
    } else if (absValue < 5) {
        return isImprovement ? "Umiarkowana poprawa" : "Umiarkowany spadek";
    } else if (absValue < 10) {
        return isImprovement ? "Znaczna poprawa" : "Znaczny spadek";
    } else {
        return isImprovement ? "Wyraźny postęp" : "Wyraźny regres";
    }
};
