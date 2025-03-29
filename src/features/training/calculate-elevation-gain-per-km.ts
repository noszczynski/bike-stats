import { Training } from '../../types/training';

export const calculateElevationGainPerKm = (trainings: Training[]): number => {
    if (trainings.length === 0) return 0;

    const totalElevation = trainings.reduce((sum, training) => sum + training.elevation_gain_m, 0);
    const totalDistance = trainings.reduce((sum, training) => sum + training.distance_km, 0);

    return totalElevation / totalDistance;
};
