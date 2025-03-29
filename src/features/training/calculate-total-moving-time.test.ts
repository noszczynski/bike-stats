import trainingsData from '../../data/trainings.json';
import { Training } from '../../types/training';
import { calculateTotalMovingTime } from './calculate-total-moving-time';
import { describe, expect, it } from 'vitest';

describe('calculateTotalMovingTime', () => {
    it('should calculate total moving time correctly for sample data', () => {
        const result = calculateTotalMovingTime(trainingsData as Training[]);
        expect(result).toMatch(/^\d+:\d{2}:\d{2}$/); // Should be in format h:mm:ss
    });

    it('should sum up times correctly', () => {
        const trainings = [
            { moving_time: '0:30:00' },
            { moving_time: '1:15:00' },
            { moving_time: '0:45:00' }
        ] as Training[];

        expect(calculateTotalMovingTime(trainings)).toEqual('2:30:00');
    });

    it('should return 0:00:00 for empty array', () => {
        expect(calculateTotalMovingTime([])).toEqual('0:00:00');
    });

    it('should handle array with one element', () => {
        const trainings = [{ moving_time: '1:23:45' }] as Training[];
        expect(calculateTotalMovingTime(trainings)).toEqual('1:23:45');
    });

    it('should handle times that roll over hours', () => {
        const trainings = [{ moving_time: '1:45:00' }, { moving_time: '0:30:00' }] as Training[];

        expect(calculateTotalMovingTime(trainings)).toEqual('2:15:00');
    });

    it('should handle times that roll over minutes', () => {
        const trainings = [{ moving_time: '1:45:30' }, { moving_time: '0:15:45' }] as Training[];

        expect(calculateTotalMovingTime(trainings)).toEqual('2:01:15');
    });
});
