import { Training } from "../../types/training";

export const calculateTotalDistance = (trainings: Training[]): number => {
    if (trainings.length === 0) return 0;

    return trainings.reduce((sum, training) => sum + training.distance_km, 0);
};
