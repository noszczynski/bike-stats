import { describe, expect, it } from "vitest";

import trainingsData from "../../data/trainings.json";
import { Training } from "../../types/training";
import { getIntensityMetricsOverTime } from "./get-intensity-metrics-over-time";

describe("getIntensityMetricsOverTime", () => {
    it("should generate metrics correctly for sample data", () => {
        const result = getIntensityMetricsOverTime(trainingsData as Training[]);

        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(trainingsData.length);
        expect(result[0]).toHaveProperty("date");
        expect(result[0]).toHaveProperty("intensity");
        expect(result[0]).toHaveProperty("distanceContribution");
        expect(result[0]).toHaveProperty("speedContribution");
        expect(result[0]).toHaveProperty("heartRateContribution");
        expect(result[0]).toHaveProperty("elevationContribution");
    });

    it("should calculate intensity values between 0 and 100", () => {
        const result = getIntensityMetricsOverTime(trainingsData as Training[]);

        for (const item of result) {
            expect(item.intensity).toBeGreaterThanOrEqual(0);
            expect(item.intensity).toBeLessThanOrEqual(100);
        }
    });

    it("should sort trainings chronologically", () => {
        const trainings = [
            {
                date: "2023-01-03",
                distance_km: 10,
                avg_speed_kmh: 15,
                avg_heart_rate_bpm: 140,
                elevation_gain_m: 100,
            },
            {
                date: "2023-01-01",
                distance_km: 10,
                avg_speed_kmh: 15,
                avg_heart_rate_bpm: 140,
                elevation_gain_m: 100,
            },
            {
                date: "2023-01-02",
                distance_km: 10,
                avg_speed_kmh: 15,
                avg_heart_rate_bpm: 140,
                elevation_gain_m: 100,
            },
        ] as Training[];

        const result = getIntensityMetricsOverTime(trainings);

        expect(result[0].date).toEqual("2023-01-01");
        expect(result[1].date).toEqual("2023-01-02");
        expect(result[2].date).toEqual("2023-01-03");
    });

    it("should return empty array for empty input", () => {
        const result = getIntensityMetricsOverTime([]);
        expect(result).toEqual([]);
    });

    it("should handle trainings with missing heart rate data", () => {
        const trainings = [
            {
                date: "2023-01-01",
                distance_km: 10,
                avg_speed_kmh: 15,
                avg_heart_rate_bpm: 0,
                elevation_gain_m: 100,
            },
        ] as Training[];

        const result = getIntensityMetricsOverTime(trainings);

        expect(result.length).toBe(1);
        expect(result[0].heartRateContribution).toEqual(10); // Default 0.5 * 20
    });

    it("should calculate component contributions correctly", () => {
        // Create two trainings where the second one has double values
        const trainings = [
            {
                date: "2023-01-01",
                distance_km: 10,
                avg_speed_kmh: 15,
                avg_heart_rate_bpm: 140,
                elevation_gain_m: 100,
            },
            {
                date: "2023-01-02",
                distance_km: 20,
                avg_speed_kmh: 30,
                avg_heart_rate_bpm: 140,
                elevation_gain_m: 200,
            },
        ] as Training[];

        const result = getIntensityMetricsOverTime(trainings);

        // The second training should have higher distance and speed contributions
        expect(result[1].distanceContribution).toBeGreaterThan(result[0].distanceContribution);
        expect(result[1].speedContribution).toBeGreaterThan(result[0].speedContribution);
        expect(result[1].elevationContribution).toBeGreaterThan(result[0].elevationContribution);
    });
});
