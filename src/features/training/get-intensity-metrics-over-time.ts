import { Training } from '@/types/training';

/**
 * Calculates training intensity over time
 * Intensity is a composite score based on speed, distance, heart rate and elevation
 *
 * @param trainings Array of training data
 * @returns Array of data points with date and intensity score
 */
export const getIntensityMetricsOverTime = (trainings: Training[]) => {
    // Sort by date to ensure chronological order
    const sortedTrainings = [...trainings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate max values for normalization
    const maxDistance = Math.max(...sortedTrainings.map((t) => t.distance_km));
    const maxSpeed = Math.max(...sortedTrainings.map((t) => t.avg_speed_kmh));
    const maxHR = Math.max(...sortedTrainings.map((t) => t.avg_heart_rate_bpm || 0));
    const maxElevation = Math.max(...sortedTrainings.map((t) => t.elevation_gain_m));

    return sortedTrainings.map((training) => {
        // Normalize each component (0-1 scale)
        const distanceScore = training.distance_km / maxDistance;
        const speedScore = training.avg_speed_kmh / maxSpeed;
        const heartRateScore = training.avg_heart_rate_bpm ? training.avg_heart_rate_bpm / maxHR : 0.5;
        const elevationScore = training.elevation_gain_m / maxElevation;

        // Calculate composite intensity score (0-100 scale)
        const intensityScore = Math.round(
            (distanceScore * 0.3 + speedScore * 0.3 + heartRateScore * 0.2 + elevationScore * 0.2) * 100
        );

        return {
            date: training.date,
            intensity: intensityScore,
            // Include individual components for detailed analysis
            distanceContribution: Math.round(distanceScore * 30),
            speedContribution: Math.round(speedScore * 30),
            heartRateContribution: Math.round(heartRateScore * 20),
            elevationContribution: Math.round(elevationScore * 20)
        };
    });
};
