import { Training } from '@/types/training';

/**
 * Analyzes elevation gain metrics over time from training data
 *
 * @param trainings Array of training data
 * @returns Array of data points with date, elevation gain, and elevation gain per km
 */
export const getElevationMetricsOverTime = (trainings: Training[]) => {
    // Sort by date to ensure chronological order
    const sortedTrainings = [...trainings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return sortedTrainings.map((training) => {
        const elevationPerKm = parseFloat((training.elevation_gain_m / training.distance_km).toFixed(2));

        return {
            date: training.date,
            elevationGain: training.elevation_gain_m,
            elevationPerKm
        };
    });
};
