import { Training } from "@/types/training";

/**
 * Analyzes distance metrics over time from training data
 *
 * @param trainings Array of training data
 * @returns Array of data points with date and distance
 */
export const getDistanceMetricsOverTime = (trainings: Training[]) => {
    // Sort by date to ensure chronological order
    const sortedTrainings = [...trainings].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Calculate cumulative distance
    let cumulativeDistance = 0;

    return sortedTrainings.map(training => {
        cumulativeDistance += training.distance_km;

        return {
            date: training.date,
            distance: training.distance_km,
            cumulativeDistance: parseFloat(cumulativeDistance.toFixed(2)),
        };
    });
};
