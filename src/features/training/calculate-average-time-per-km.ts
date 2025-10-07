import { Training } from "../../types/training";
import { minutesToTimeString, timeStringToMinutes } from "../../utils/time";

export const calculateAverageTimePerKm = (trainings: Training[]): string => {
    if (trainings.length === 0) return "0:00:00";

    const totalTime = trainings.reduce(
        (sum, training) => sum + timeStringToMinutes(training.moving_time),
        0,
    );
    const totalDistance = trainings.reduce((sum, training) => sum + training.distance_km, 0);

    return minutesToTimeString(totalTime / totalDistance);
};
