import { describe, expect, it } from "vitest";

import trainingsData from "../../data/trainings.json";
import { Training } from "../../types/training";
import { calculateElevationGainPerKm } from "./calculate-elevation-gain-per-km";

describe("calculateElevationGainPerKm", () => {
    it("should calculate elevation gain per km correctly for sample data", () => {
        const result = calculateElevationGainPerKm(trainingsData as Training[]);
        expect(result).toBeGreaterThan(0); // Sample data contains elevation gain values
    });

    it("should handle simple custom training data correctly", () => {
        const trainings = [
            { elevation_gain_m: 100, distance_km: 10 }, // 10 m/km
            { elevation_gain_m: 200, distance_km: 20 }, // 10 m/km
        ] as Training[];

        expect(calculateElevationGainPerKm(trainings)).toEqual(10);
    });

    it("should return 0 for empty array", () => {
        expect(calculateElevationGainPerKm([])).toEqual(0);
    });

    it("should handle mixed elevation gains correctly", () => {
        const trainings = [
            { elevation_gain_m: 150, distance_km: 10 }, // 15 m/km
            { elevation_gain_m: 50, distance_km: 10 }, // 5 m/km
        ] as Training[];

        expect(calculateElevationGainPerKm(trainings)).toEqual(10);
    });

    it("should handle single training entry", () => {
        const trainings = [
            { elevation_gain_m: 300, distance_km: 30 }, // 10 m/km
        ] as Training[];

        expect(calculateElevationGainPerKm(trainings)).toEqual(10);
    });
});
