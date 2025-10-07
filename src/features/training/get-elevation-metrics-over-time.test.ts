import { describe, expect, it } from "vitest";

import trainingsData from "../../data/trainings.json";
import { Training } from "../../types/training";
import { getElevationMetricsOverTime } from "./get-elevation-metrics-over-time";

describe("getElevationMetricsOverTime", () => {
    it("should generate metrics correctly for sample data", () => {
        const result = getElevationMetricsOverTime(trainingsData as Training[]);

        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(trainingsData.length);
        expect(result[0]).toHaveProperty("date");
        expect(result[0]).toHaveProperty("elevationGain");
        expect(result[0]).toHaveProperty("elevationPerKm");
    });

    it("should calculate elevation per km correctly", () => {
        const trainings = [
            { date: "2023-01-01", elevation_gain_m: 100, distance_km: 10 }, // 10 m/km
            { date: "2023-01-02", elevation_gain_m: 200, distance_km: 20 }, // 10 m/km
        ] as Training[];

        const result = getElevationMetricsOverTime(trainings);

        expect(result[0].elevationPerKm).toEqual(10);
        expect(result[1].elevationPerKm).toEqual(10);
    });

    it("should sort trainings chronologically", () => {
        const trainings = [
            { date: "2023-01-03", elevation_gain_m: 100, distance_km: 10 },
            { date: "2023-01-01", elevation_gain_m: 100, distance_km: 10 },
            { date: "2023-01-02", elevation_gain_m: 100, distance_km: 10 },
        ] as Training[];

        const result = getElevationMetricsOverTime(trainings);

        expect(result[0].date).toEqual("2023-01-01");
        expect(result[1].date).toEqual("2023-01-02");
        expect(result[2].date).toEqual("2023-01-03");
    });

    it("should return empty array for empty input", () => {
        const result = getElevationMetricsOverTime([]);
        expect(result).toEqual([]);
    });

    it("should handle single training entry", () => {
        const trainings = [
            { date: "2023-01-01", elevation_gain_m: 100, distance_km: 10 },
        ] as Training[];

        const result = getElevationMetricsOverTime(trainings);

        expect(result.length).toBe(1);
        expect(result[0].elevationPerKm).toEqual(10);
    });

    it("should format elevation per km to 2 decimal places", () => {
        const trainings = [
            { date: "2023-01-01", elevation_gain_m: 100, distance_km: 33.333 }, // ~3.00 m/km
        ] as Training[];

        const result = getElevationMetricsOverTime(trainings);

        expect(result[0].elevationPerKm).toEqual(3);
    });
});
