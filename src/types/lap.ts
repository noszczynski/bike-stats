export interface Lap {
    id: string;
    lap_number: number;
    start_time: string;
    end_time: string;
    distance_m: number;
    moving_time_s: number;
    elapsed_time_s: number;
    avg_speed_ms: number | null;
    max_speed_ms: number | null;
    avg_heart_rate_bpm: number | null;
    max_heart_rate_bpm: number | null;
    avg_cadence_rpm: number | null;
    max_cadence_rpm: number | null;
    total_elevation_gain_m: number | null;
    start_latitude: number | null;
    start_longitude: number | null;
    end_latitude: number | null;
    end_longitude: number | null;
    created_at: string;
}

export interface LapsResponse {
    laps: Lap[];
    count: number;
}

export interface GenerateLapsResponse {
    success: boolean;
    message: string;
    laps: Lap[];
    lap_distance_km: number;
}

export interface FitStatusResponse {
    fit_processed: boolean;
    trackpoints_count: number;
    laps_count: number;
} 