import { describe, expect, it } from "vitest";

import { emptyTrainings, mockAvgSpeed, mockTrainings } from "../../data/trainings.mock";
import { Training } from "../../types/training";
import { calculateAverageSpeed } from "./calculate-average-speed";

describe("calculateAverageSpeed", () => {
    it("should calculate average speed correctly for sample data", () => {
        const result = calculateAverageSpeed(mockTrainings);
        expect(result).toBeCloseTo(mockAvgSpeed, 1); // Use the pre-calculated value from mock data
    });

    it("should round to specified decimal places", () => {
        const trainings = [
            { avg_speed_kmh: 10.123 },
            { avg_speed_kmh: 15.456 },
            { avg_speed_kmh: 20.789 },
        ] as Training[];

        expect(calculateAverageSpeed(trainings, 1)).toEqual(15.5);
        expect(calculateAverageSpeed(trainings, 2)).toEqual(15.46);
        expect(calculateAverageSpeed(trainings, 3)).toEqual(15.456);
    });

    it("should return 0 for empty array", () => {
        expect(calculateAverageSpeed(emptyTrainings)).toEqual(0);
    });

    it("should handle array with one element", () => {
        const trainings = [{ avg_speed_kmh: 15.5 }] as Training[];
        expect(calculateAverageSpeed(trainings)).toEqual(15.5);
    });

    it("should use default decimal places (1) when not specified", () => {
        const trainings = [{ avg_speed_kmh: 15.44 }, { avg_speed_kmh: 15.46 }] as Training[];

        expect(calculateAverageSpeed(trainings)).toEqual(15.5);
    });
});
