export type TrainerLapMetrics = {
    moving_time_s: number;
    distance_m: number;
    avg_power_watts: number | null;
    max_power_watts: number | null;
    avg_cadence_rpm: number | null;
    max_cadence_rpm: number | null;
    avg_heart_rate_bpm: number | null;
    max_heart_rate_bpm: number | null;
};
