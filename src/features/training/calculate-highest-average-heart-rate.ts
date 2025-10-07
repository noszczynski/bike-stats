import { Training } from "../../types/training";

export const calculateHighestAverageHeartRate = (trainings: Training[]): number => {
    if (trainings.length === 0) return 0;

    const validHeartRates = trainings.filter(training => training.avg_heart_rate_bpm > 0);
    if (validHeartRates.length === 0) return 0;

    return Math.max(...validHeartRates.map(training => training.avg_heart_rate_bpm));
};
