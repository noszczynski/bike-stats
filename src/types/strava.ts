export interface StravaAuthResponse {
    token_type: string;
    expires_at: number;
    expires_in: number;
    refresh_token: string;
    access_token: string;
    athlete: StravaAthlete;
}

export interface StravaAthlete {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    city: string;
    state: string;
    country: string;
    profile: string;
    profile_medium: string;
}

export interface StravaTokens {
    access_token: string;
    refresh_token: string;
    expires_at: number;
}
