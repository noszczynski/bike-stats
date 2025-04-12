import { Training } from '@/types/training';

export interface TrainingLoadResult {
    date: string;
    intensity: number;
    distanceContribution: number;
    speedContribution: number;
    heartRateContribution: number;
    elevationContribution: number;
}

export interface MaxValues {
    maxDistance: number;
    maxSpeed: number;
    maxHR: number;
    maxElevation: number;
}

/**
 * Calculates training intensity for a single training
 * Intensity is a composite score based on speed, distance, heart rate and elevation
 *
 * @param training Single training data
 * @param maxValues Maximum values for normalization
 * @returns Object with intensity score and component contributions
 */
export const calculateTrainingLoad = (training: Training, maxValues: MaxValues): TrainingLoadResult => {
    const { maxDistance, maxSpeed, maxHR, maxElevation } = maxValues;

    // Normalize each component (0-1 scale)
    const distanceScore = Math.min(training.distance_km / maxDistance, 1);
    const speedScore = Math.min(training.avg_speed_kmh / maxSpeed, 1);
    const heartRateScore = training.avg_heart_rate_bpm ? Math.min(training.avg_heart_rate_bpm / maxHR, 1) : 0.5;
    const elevationScore = Math.min(training.elevation_gain_m / maxElevation, 1);

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
};
