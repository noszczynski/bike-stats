import { emptyTrainings, mockTrainings } from '../../data/trainings.mock';
import { Training } from '../../types/training';
import { getDistanceMetricsOverTime } from './get-distance-metrics-over-time';
import { describe, expect, it } from 'vitest';

describe('getDistanceMetricsOverTime', () => {
    it('should generate metrics correctly for sample data', () => {
        const result = getDistanceMetricsOverTime(mockTrainings);

        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(mockTrainings.length);
        expect(result[0]).toHaveProperty('date');
        expect(result[0]).toHaveProperty('distance');
        expect(result[0]).toHaveProperty('cumulativeDistance');
    });

    it('should calculate cumulative distance correctly', () => {
        const trainings = [
            { date: '2023-01-01', distance_km: 10 },
            { date: '2023-01-02', distance_km: 15 },
            { date: '2023-01-03', distance_km: 5 }
        ] as Training[];

        const result = getDistanceMetricsOverTime(trainings);

        expect(result[0].cumulativeDistance).toEqual(10);
        expect(result[1].cumulativeDistance).toEqual(25);
        expect(result[2].cumulativeDistance).toEqual(30);
    });

    it('should sort trainings chronologically', () => {
        const trainings = [
            { date: '2023-01-03', distance_km: 5 },
            { date: '2023-01-01', distance_km: 10 },
            { date: '2023-01-02', distance_km: 15 }
        ] as Training[];

        const result = getDistanceMetricsOverTime(trainings);

        expect(result[0].date).toEqual('2023-01-01');
        expect(result[1].date).toEqual('2023-01-02');
        expect(result[2].date).toEqual('2023-01-03');
    });

    it('should return empty array for empty input', () => {
        const result = getDistanceMetricsOverTime(emptyTrainings);
        expect(result).toEqual([]);
    });

    it('should handle single training entry', () => {
        const trainings = [{ date: '2023-01-01', distance_km: 10 }] as Training[];

        const result = getDistanceMetricsOverTime(trainings);

        expect(result.length).toBe(1);
        expect(result[0].cumulativeDistance).toEqual(10);
    });

    it('should format cumulative distance to 2 decimal places', () => {
        const trainings = [
            { date: '2023-01-01', distance_km: 10.123 },
            { date: '2023-01-02', distance_km: 5.456 }
        ] as Training[];

        const result = getDistanceMetricsOverTime(trainings);

        expect(result[0].cumulativeDistance).toEqual(10.12);
        expect(result[1].cumulativeDistance).toEqual(15.58);
    });
});
