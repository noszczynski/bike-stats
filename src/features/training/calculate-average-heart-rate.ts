import { Training } from '../../types/training';

export const calculateAverageHeartRate = (trainings: Training[]): number => {
    if (trainings.length === 0) return 0;

    const validHeartRates = trainings.filter((training) => training.avg_heart_rate_bpm > 0);
    if (validHeartRates.length === 0) return 0;

    const totalHeartRate = validHeartRates.reduce((sum, training) => sum + training.avg_heart_rate_bpm, 0);

    return totalHeartRate / validHeartRates.length;
};
