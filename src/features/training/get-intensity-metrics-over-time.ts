import { Training } from "@/types/training";

import { calculateTrainingLoad } from "./calculate-training-load";

/**
 * Calculates training intensity over time for multiple trainings
 * Intensity is a composite score based on speed, distance, heart rate and elevation
 *
 * @param trainings Array of training data
 * @returns Array of data points with date and intensity score
 */
export const getIntensityMetricsOverTime = (trainings: Training[]) => {
    // Sort by date to ensure chronological order
    const sortedTrainings = [...trainings].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Calculate max values for normalization
    const maxValues = {
        maxDistance: Math.max(...sortedTrainings.map(t => t.distance_km)),
        maxSpeed: Math.max(...sortedTrainings.map(t => t.avg_speed_kmh)),
        maxHR: Math.max(...sortedTrainings.map(t => t.avg_heart_rate_bpm || 0)),
        maxElevation: Math.max(...sortedTrainings.map(t => t.elevation_gain_m)),
    };

    return sortedTrainings.map(training => calculateTrainingLoad(training, maxValues));
};
