import { describe, expect, it } from "vitest";

import trainingsData from "../../data/trainings.json";
import { Training } from "../../types/training";
import { calculateHighestDistance } from "./calculate-highest-distance";

describe("calculateHighestDistance", () => {
    it("should find highest distance correctly for sample data", () => {
        const result = calculateHighestDistance(trainingsData as Training[]);
        expect(result).toBeGreaterThan(0); // Sample data contains distance values
    });

    it("should find highest value from the array", () => {
        const trainings = [
            { distance_km: 10.5 },
            { distance_km: 25.8 },
            { distance_km: 15.2 },
        ] as Training[];

        expect(calculateHighestDistance(trainings)).toEqual(25.8);
    });

    it("should return 0 for empty array", () => {
        expect(calculateHighestDistance([])).toEqual(0);
    });

    it("should handle array with one element", () => {
        const trainings = [{ distance_km: 42.2 }] as Training[];
        expect(calculateHighestDistance(trainings)).toEqual(42.2);
    });

    it("should handle negative distances (though not realistic)", () => {
        const trainings = [{ distance_km: -5 }, { distance_km: 10 }] as Training[];

        expect(calculateHighestDistance(trainings)).toEqual(10);
    });
});
