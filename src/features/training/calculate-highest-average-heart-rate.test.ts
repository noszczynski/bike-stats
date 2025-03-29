import trainingsData from '../../data/trainings.json';
import { Training } from '../../types/training';
import { calculateHighestAverageHeartRate } from './calculate-highest-average-heart-rate';
import { describe, expect, it } from 'vitest';

describe('calculateHighestAverageHeartRate', () => {
    it('should find highest average heart rate correctly for sample data', () => {
        const result = calculateHighestAverageHeartRate(trainingsData as Training[]);
        expect(result).toBeGreaterThan(0); // Sample data contains heart rate values
    });

    it('should filter out trainings with zero heart rate', () => {
        const trainings = [
            { avg_heart_rate_bpm: 150 },
            { avg_heart_rate_bpm: 0 },
            { avg_heart_rate_bpm: 170 },
            { avg_heart_rate_bpm: 0 }
        ] as Training[];

        expect(calculateHighestAverageHeartRate(trainings)).toEqual(170);
    });

    it('should return 0 for empty array', () => {
        expect(calculateHighestAverageHeartRate([])).toEqual(0);
    });

    it('should return 0 if all heart rates are zero', () => {
        const trainings = [{ avg_heart_rate_bpm: 0 }, { avg_heart_rate_bpm: 0 }] as Training[];

        expect(calculateHighestAverageHeartRate(trainings)).toEqual(0);
    });

    it('should handle array with one valid heart rate', () => {
        const trainings = [{ avg_heart_rate_bpm: 145 }] as Training[];
        expect(calculateHighestAverageHeartRate(trainings)).toEqual(145);
    });
});
