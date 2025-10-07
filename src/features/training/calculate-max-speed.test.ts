import { describe, expect, it } from "vitest";

import trainingsData from "../../data/trainings.json";
import { Training } from "../../types/training";
import { calculateMaxSpeed } from "./calculate-max-speed";

describe("calculateMaxSpeed", () => {
    it("should find maximum speed correctly for sample data", () => {
        const result = calculateMaxSpeed(trainingsData as Training[]);
        expect(result).toBeGreaterThan(0); // Sample data contains max speed values
    });

    it("should find highest value from the array", () => {
        const trainings = [
            { max_speed_kmh: 35.2 },
            { max_speed_kmh: 42.8 },
            { max_speed_kmh: 31.6 },
        ] as Training[];

        expect(calculateMaxSpeed(trainings)).toEqual(42.8);
    });

    it("should return 0 for empty array", () => {
        expect(calculateMaxSpeed([])).toEqual(0);
    });

    it("should handle array with one element", () => {
        const trainings = [{ max_speed_kmh: 55.5 }] as Training[];
        expect(calculateMaxSpeed(trainings)).toEqual(55.5);
    });

    it("should handle negative speeds (though not realistic)", () => {
        const trainings = [{ max_speed_kmh: -5 }, { max_speed_kmh: 25 }] as Training[];

        expect(calculateMaxSpeed(trainings)).toEqual(25);
    });
});
