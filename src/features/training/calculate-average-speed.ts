import { Training } from '../../types/training';

export const calculateAverageSpeed = (trainings: Training[]): number => {
    if (trainings.length === 0) return 0;

    const totalSpeed = trainings.reduce((sum, training) => sum + training.avg_speed_kmh, 0);

    return totalSpeed / trainings.length;
};
