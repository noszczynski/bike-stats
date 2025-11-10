export interface Trackpoint {
    id: string;
    timestamp: string;
    latitude: number | null;
    longitude: number | null;
    altitude_m: number | null;
    distance_m: number | null;
    speed_ms: number | null;
    heart_rate_bpm: number | null;
    cadence_rpm: number | null;
    power_watts: number | null;
    temperature_c: number | null;
}

export interface TrackpointsResponse {
    trackpoints: Trackpoint[];
    pagination: {
        total: number;
        offset: number;
        limit: number;
        hasMore: boolean;
    };
}
