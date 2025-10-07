import { Training } from "../../types/training";
import { minutesToTimeString, timeStringToMinutes } from "../../utils/time";

export const calculateTotalMovingTime = (trainings: Training[]): string => {
    if (trainings.length === 0) return "0:00:00";

    const totalMinutes = trainings.reduce(
        (sum, training) => sum + timeStringToMinutes(training.moving_time),
        0,
    );

    return minutesToTimeString(totalMinutes);
};
