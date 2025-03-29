import { Training } from '../../types/training';
import { minutesToTimeString, timeStringToMinutes } from '../../utils/time';

export const calculateShortestTimePerKm = (trainings: Training[]): string => {
    if (trainings.length === 0) return '0:00:00';

    const timesPerKm = trainings.map((training) => timeStringToMinutes(training.moving_time) / training.distance_km);

    return minutesToTimeString(Math.min(...timesPerKm));
};
