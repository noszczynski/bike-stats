import { describe, expect, it } from "vitest";

import {
    emptyTrainings,
    mockAverageHeartRate,
    mockTrainings,
    trainingsWithZeroHeartRate,
} from "../../data/trainings.mock";
import { Training } from "../../types/training";
import { calculateAverageHeartRate } from "./calculate-average-heart-rate";

describe("calculateAverageHeartRate", () => {
    it("should calculate average heart rate correctly for sample data", () => {
        const result = calculateAverageHeartRate(mockTrainings);
        expect(result).toBeCloseTo(mockAverageHeartRate, 0); // Use the pre-calculated value from mock data
    });

    it("should filter out trainings with zero heart rate", () => {
        const trainings = [
            { avg_heart_rate_bpm: 150 },
            { avg_heart_rate_bpm: 0 },
            { avg_heart_rate_bpm: 160 },
            { avg_heart_rate_bpm: 0 },
        ] as Training[];

        expect(calculateAverageHeartRate(trainings)).toEqual(155);
    });

    it("should return 0 for empty array", () => {
        expect(calculateAverageHeartRate(emptyTrainings)).toEqual(0);
    });

    it("should return 0 if all heart rates are zero", () => {
        expect(calculateAverageHeartRate(trainingsWithZeroHeartRate)).toEqual(0);
    });

    it("should handle array with one valid heart rate", () => {
        const trainings = [{ avg_heart_rate_bpm: 145 }] as Training[];
        expect(calculateAverageHeartRate(trainings)).toEqual(145);
    });
});
