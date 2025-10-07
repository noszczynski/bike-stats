// Types for FIT file data processing

export interface FitTrackpoint {
    timestamp: Date;
    latitude?: number;
    longitude?: number;
    altitude?: number; // meters
    distance?: number; // meters
    speed?: number; // meters per second
    heart_rate?: number; // bpm
    cadence?: number; // rpm
    temperature?: number; // celsius
}

export interface FitLap {
    lap_number: number;
    start_time: Date;
    end_time: Date;
    distance: number; // meters
    moving_time: number; // seconds
    elapsed_time: number; // seconds
    avg_speed?: number; // meters per second
    max_speed?: number; // meters per second
    avg_heart_rate?: number; // bpm
    max_heart_rate?: number; // bpm
    avg_cadence?: number; // rpm
    max_cadence?: number; // rpm
    total_elevation_gain?: number; // meters
    start_latitude?: number;
    start_longitude?: number;
    end_latitude?: number;
    end_longitude?: number;
}

export interface FitActivity {
    start_time: Date;
    total_time: number; // seconds
    distance: number; // meters
    avg_speed?: number; // meters per second
    max_speed?: number; // meters per second
    avg_heart_rate?: number; // bpm
    max_heart_rate?: number; // bpm
    total_elevation_gain?: number; // meters
    trackpoints: FitTrackpoint[];
    laps: FitLap[];
}

export interface ParsedFitFile {
    activity: FitActivity;
    sport: string;
    device?: string;
    timestamp: Date;
}

// Database insert types
export interface TrackpointInsert {
    activity_id: string;
    timestamp: Date;
    latitude?: number;
    longitude?: number;
    altitude_m?: number;
    distance_m?: number;
    speed_ms?: number;
    heart_rate_bpm?: number;
    cadence_rpm?: number;
    temperature_c?: number;
}

export interface LapInsert {
    activity_id: string;
    lap_number: number;
    start_time: Date;
    end_time: Date;
    distance_m: number;
    moving_time_s: number;
    elapsed_time_s: number;
    avg_speed_ms?: number;
    max_speed_ms?: number;
    avg_heart_rate_bpm?: number;
    max_heart_rate_bpm?: number;
    avg_cadence_rpm?: number;
    max_cadence_rpm?: number;
    total_elevation_gain_m?: number;
    start_latitude?: number;
    start_longitude?: number;
    end_latitude?: number;
    end_longitude?: number;
}
