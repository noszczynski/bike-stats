import { Training } from '../../types/training';

export const calculateHighestAverageSpeed = (trainings: Training[]): number => {
    if (trainings.length === 0) return 0;

    return Math.max(...trainings.map((training) => training.avg_speed_kmh));
};
