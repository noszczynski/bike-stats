import { Training } from '../../types/training';

export const calculateMaxSpeed = (trainings: Training[]): number => {
    if (trainings.length === 0) return 0;

    return Math.max(...trainings.map((training) => training.max_speed_kmh));
};
