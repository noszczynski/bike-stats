import { Training } from '@/types/training';

/**
 * Analyzes speed metrics over time from training data
 *
 * @param trainings Array of training data sorted by date
 * @returns Array of data points with date, average speed, and max speed
 */
export const getSpeedMetricsOverTime = (trainings: Training[]) => {
    // Sort by date to ensure chronological order
    const sortedTrainings = [...trainings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return sortedTrainings.map((training) => ({
        date: training.date,
        avgSpeed: training.avg_speed_kmh,
        maxSpeed: training.max_speed_kmh
    }));
};
