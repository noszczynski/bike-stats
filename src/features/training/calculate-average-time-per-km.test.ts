import trainingsData from '../../data/trainings.json';
import { Training } from '../../types/training';
import { calculateAverageTimePerKm } from './calculate-average-time-per-km';
import { describe, expect, it } from 'vitest';

describe('calculateAverageTimePerKm', () => {
    it('should calculate average time per km correctly for sample data', () => {
        const result = calculateAverageTimePerKm(trainingsData as Training[]);
        expect(result).toMatch(/^\d+:\d{2}:\d{2}$/); // Should be in format h:mm:ss
    });

    it('should handle custom training data correctly', () => {
        const trainings = [
            { moving_time: '0:15:00', distance_km: 3 }, // 5 min/km
            { moving_time: '0:20:00', distance_km: 4 } // 5 min/km
        ] as Training[];

        expect(calculateAverageTimePerKm(trainings)).toEqual('0:05:00');
    });

    it('should return 0:00:00 for empty array', () => {
        expect(calculateAverageTimePerKm([])).toEqual('0:00:00');
    });

    it('should calculate properly when times are in different formats', () => {
        const trainings = [
            { moving_time: '0:30:00', distance_km: 5 }, // 6 min/km
            { moving_time: '1:00:00', distance_km: 10 } // 6 min/km
        ] as Training[];

        expect(calculateAverageTimePerKm(trainings)).toEqual('0:06:00');
    });

    it('should handle single training entry', () => {
        const trainings = [
            { moving_time: '1:00:00', distance_km: 10 } // 6 min/km
        ] as Training[];

        expect(calculateAverageTimePerKm(trainings)).toEqual('0:06:00');
    });
});
