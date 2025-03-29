import trainingsData from '../../data/trainings.json';
import { Training } from '../../types/training';
import { calculateTotalDistance } from './calculate-total-distance';
import { describe, expect, it } from 'vitest';

describe('calculateTotalDistance', () => {
    it('should calculate total distance correctly for sample data', () => {
        const result = calculateTotalDistance(trainingsData as Training[]);
        expect(result).toBeGreaterThan(0); // Sample data contains distance values
    });

    it('should sum up distances correctly', () => {
        const trainings = [{ distance_km: 10 }, { distance_km: 20 }, { distance_km: 30 }] as Training[];

        expect(calculateTotalDistance(trainings)).toEqual(60);
    });

    it('should return 0 for empty array', () => {
        expect(calculateTotalDistance([])).toEqual(0);
    });

    it('should handle array with one element', () => {
        const trainings = [{ distance_km: 42.2 }] as Training[];
        expect(calculateTotalDistance(trainings)).toEqual(42.2);
    });

    it('should handle decimal values correctly', () => {
        const trainings = [{ distance_km: 10.5 }, { distance_km: 20.75 }] as Training[];

        expect(calculateTotalDistance(trainings)).toEqual(31.25);
    });
});
