/**
 * Client-side Strava configuration
 * todo: approval_prompt=force
 */
export const STRAVA_AUTH_URL = `https://www.strava.com/oauth/authorize?client_id=${153786}&response_type=code&redirect_uri=http://localhost:3100/api/strava/callback&scope=activity:read_all`;
