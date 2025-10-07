import { Training } from "../../types/training";

export const calculateAverageSpeed = (trainings: Training[], decimals = 1): number => {
    if (trainings.length === 0) return 0;

    const totalSpeed = trainings.reduce((sum, training) => sum + training.avg_speed_kmh, 0);

    return Math.round((totalSpeed / trainings.length) * 10 ** decimals) / 10 ** decimals;
};
