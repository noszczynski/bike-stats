import { decimalToNumber } from "@/lib/ai/tools/utils";

export function mapStravaActivity(
    strava:
        | {
              name: string;
              date: Date;
              distance_m: number;
              moving_time_s: number;
              elevation_gain_m: number;
              avg_speed_kmh: unknown;
              max_speed_kmh: unknown;
              avg_heart_rate_bpm?: number | null;
              max_heart_rate_bpm?: number | null;
          }
        | null
        | undefined,
) {
    if (!strava) return null;

    return {
        ...strava,
        avg_speed_kmh: decimalToNumber(strava.avg_speed_kmh),
        max_speed_kmh: decimalToNumber(strava.max_speed_kmh),
        avg_heart_rate_bpm: strava.avg_heart_rate_bpm ?? null,
        max_heart_rate_bpm: strava.max_heart_rate_bpm ?? null,
    };
}
