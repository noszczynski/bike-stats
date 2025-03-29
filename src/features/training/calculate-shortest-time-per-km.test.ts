import trainingsData from '../../data/trainings.json';
import { Training } from '../../types/training';
import { calculateShortestTimePerKm } from './calculate-shortest-time-per-km';
import { describe, expect, it } from 'vitest';

describe('calculateShortestTimePerKm', () => {
    it('should calculate shortest time per km correctly for sample data', () => {
        const result = calculateShortestTimePerKm(trainingsData as Training[]);
        expect(result).toMatch(/^\d+:\d{2}:\d{2}$/); // Should be in format h:mm:ss
    });

    it('should handle custom training data correctly', () => {
        const trainings = [
            { moving_time: '0:15:00', distance_km: 3 }, // 5 min/km
            { moving_time: '0:16:00', distance_km: 4 } // 4 min/km
        ] as Training[];

        expect(calculateShortestTimePerKm(trainings)).toEqual('0:04:00');
    });

    it('should return 0:00:00 for empty array', () => {
        expect(calculateShortestTimePerKm([])).toEqual('0:00:00');
    });

    it('should calculate properly when times are in different formats', () => {
        const trainings = [
            { moving_time: '0:30:00', distance_km: 5 }, // 6 min/km
            { moving_time: '1:00:00', distance_km: 15 } // 4 min/km
        ] as Training[];

        expect(calculateShortestTimePerKm(trainings)).toEqual('0:04:00');
    });

    it('should handle single training entry', () => {
        const trainings = [
            { moving_time: '0:35:00', distance_km: 7 } // 5 min/km
        ] as Training[];

        expect(calculateShortestTimePerKm(trainings)).toEqual('0:05:00');
    });
});
