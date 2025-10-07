import { describe, expect, it } from "vitest";

import trainingsData from "../../data/trainings.json";
import { Training } from "../../types/training";
import { calculateHighestAverageSpeed } from "./calculate-highest-average-speed";

describe("calculateHighestAverageSpeed", () => {
    it("should find highest average speed correctly for sample data", () => {
        const result = calculateHighestAverageSpeed(trainingsData as Training[]);
        expect(result).toBeGreaterThan(0); // Sample data contains speed values
    });

    it("should find highest value from the array", () => {
        const trainings = [
            { avg_speed_kmh: 14.5 },
            { avg_speed_kmh: 18.2 },
            { avg_speed_kmh: 16.1 },
        ] as Training[];

        expect(calculateHighestAverageSpeed(trainings)).toEqual(18.2);
    });

    it("should return 0 for empty array", () => {
        expect(calculateHighestAverageSpeed([])).toEqual(0);
    });

    it("should handle array with one element", () => {
        const trainings = [{ avg_speed_kmh: 15.5 }] as Training[];
        expect(calculateHighestAverageSpeed(trainings)).toEqual(15.5);
    });

    it("should handle negative speeds (though not realistic)", () => {
        const trainings = [{ avg_speed_kmh: -5 }, { avg_speed_kmh: 10 }] as Training[];

        expect(calculateHighestAverageSpeed(trainings)).toEqual(10);
    });
});
