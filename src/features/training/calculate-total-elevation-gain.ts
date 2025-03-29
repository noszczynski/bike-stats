import { Training } from '../../types/training';

export const calculateTotalElevationGain = (trainings: Training[]): number => {
    if (trainings.length === 0) return 0;

    return trainings.reduce((sum, training) => sum + training.elevation_gain_m, 0);
};
