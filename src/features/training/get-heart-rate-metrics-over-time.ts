import { HeartRateZones, Training } from "@/types/training";

/**
 * Analyzes heart rate metrics over time from training data
 *
 * @param trainings Array of training data
 * @returns Array of data points with date, average heart rate, and time in zones
 */
export const getHeartRateMetricsOverTime = (trainings: Training[]) => {
    // Sort by date to ensure chronological order
    const sortedTrainings = [...trainings].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return sortedTrainings
        .filter(training => training.heart_rate_zones)
        .map(training => training as Training & { heart_rate_zones: HeartRateZones })
        .map(training => {
            const zoneTimes = {
                zone_1: timeStringToMinutes(training.heart_rate_zones.zone_1),
                zone_2: timeStringToMinutes(training.heart_rate_zones.zone_2),
                zone_3: timeStringToMinutes(training.heart_rate_zones.zone_3),
                zone_4: timeStringToMinutes(training.heart_rate_zones.zone_4),
                zone_5: timeStringToMinutes(training.heart_rate_zones.zone_5),
            };

            return {
                date: training.date,
                avgHeartRate: training.avg_heart_rate_bpm || 0,
                ...zoneTimes,
            };
        });
};

/**
 * Converts time string in format "HH:MM:SS" to minutes
 */
const timeStringToMinutes = (timeStr: string): number => {
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);

    return hours * 60 + minutes + seconds / 60;
};
