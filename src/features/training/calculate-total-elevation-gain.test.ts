import { describe, expect, it } from "vitest";

import trainingsData from "../../data/trainings.json";
import { Training } from "../../types/training";
import { calculateTotalElevationGain } from "./calculate-total-elevation-gain";

describe("calculateTotalElevationGain", () => {
    it("should calculate total elevation gain correctly for sample data", () => {
        const result = calculateTotalElevationGain(trainingsData as Training[]);
        expect(result).toBeGreaterThan(0); // Sample data contains elevation gain values
    });

    it("should sum up elevation gains correctly", () => {
        const trainings = [
            { elevation_gain_m: 100 },
            { elevation_gain_m: 200 },
            { elevation_gain_m: 300 },
        ] as Training[];

        expect(calculateTotalElevationGain(trainings)).toEqual(600);
    });

    it("should return 0 for empty array", () => {
        expect(calculateTotalElevationGain([])).toEqual(0);
    });

    it("should handle array with one element", () => {
        const trainings = [{ elevation_gain_m: 500 }] as Training[];
        expect(calculateTotalElevationGain(trainings)).toEqual(500);
    });

    it("should handle decimal values correctly", () => {
        const trainings = [{ elevation_gain_m: 100.5 }, { elevation_gain_m: 200.25 }] as Training[];

        expect(calculateTotalElevationGain(trainings)).toEqual(300.75);
    });
});
