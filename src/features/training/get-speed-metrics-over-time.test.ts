import { describe, expect, it } from "vitest";

import trainingsData from "../../data/trainings.json";
import { Training } from "../../types/training";
import { getSpeedMetricsOverTime } from "./get-speed-metrics-over-time";

describe("getSpeedMetricsOverTime", () => {
    it("should generate metrics correctly for sample data", () => {
        const result = getSpeedMetricsOverTime(trainingsData as Training[]);

        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(trainingsData.length);
        expect(result[0]).toHaveProperty("date");
        expect(result[0]).toHaveProperty("avgSpeed");
        expect(result[0]).toHaveProperty("maxSpeed");
    });

    it("should map training data correctly", () => {
        const trainings = [
            { date: "2023-01-01", avg_speed_kmh: 15, max_speed_kmh: 30 },
            { date: "2023-01-02", avg_speed_kmh: 16, max_speed_kmh: 32 },
        ] as Training[];

        const result = getSpeedMetricsOverTime(trainings);

        expect(result[0].date).toEqual("2023-01-01");
        expect(result[0].avgSpeed).toEqual(15);
        expect(result[0].maxSpeed).toEqual(30);

        expect(result[1].date).toEqual("2023-01-02");
        expect(result[1].avgSpeed).toEqual(16);
        expect(result[1].maxSpeed).toEqual(32);
    });

    it("should sort trainings chronologically", () => {
        const trainings = [
            { date: "2023-01-03", avg_speed_kmh: 15, max_speed_kmh: 30 },
            { date: "2023-01-01", avg_speed_kmh: 16, max_speed_kmh: 32 },
            { date: "2023-01-02", avg_speed_kmh: 17, max_speed_kmh: 34 },
        ] as Training[];

        const result = getSpeedMetricsOverTime(trainings);

        expect(result[0].date).toEqual("2023-01-01");
        expect(result[1].date).toEqual("2023-01-02");
        expect(result[2].date).toEqual("2023-01-03");
    });

    it("should return empty array for empty input", () => {
        const result = getSpeedMetricsOverTime([]);
        expect(result).toEqual([]);
    });

    it("should handle single training entry", () => {
        const trainings = [
            { date: "2023-01-01", avg_speed_kmh: 15, max_speed_kmh: 30 },
        ] as Training[];

        const result = getSpeedMetricsOverTime(trainings);

        expect(result.length).toBe(1);
        expect(result[0].avgSpeed).toEqual(15);
        expect(result[0].maxSpeed).toEqual(30);
    });
});
