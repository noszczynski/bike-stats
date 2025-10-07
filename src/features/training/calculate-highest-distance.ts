import { Training } from "../../types/training";

export const calculateHighestDistance = (trainings: Training[]): number => {
    if (trainings.length === 0) return 0;

    return Math.max(...trainings.map(training => training.distance_km));
};
