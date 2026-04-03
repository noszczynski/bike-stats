/**
 * Dozwolone scope’y OAuth 2.0 Hammerhead (`components.securitySchemes.hammerhead_oauth`
 * w https://api.hammerhead.io/v1/docs/openapi.yml). W parametrze `scope` żądania authorize
 * łączy się je spacją (RFC 6749 §3.3).
 */
export const HAMMERHEAD_OAUTH_SCOPES = {
    activity: {
        read: "activity:read",
    },
    route: {
        read: "route:read",
        write: "route:write",
    },
    workout: {
        write: "workout:write",
    },
} as const;

export type HammerheadOAuthScope = "activity:read" | "route:read" | "route:write" | "workout:write";

/** Łączy wiele scope’ów w wartość parametru `scope` (space-delimited). */
export function joinHammerheadOAuthScopes(scopes: readonly HammerheadOAuthScope[]): string {
    if (scopes.length === 0) {
        throw new Error("Hammerhead OAuth: at least one scope is required");
    }
    return [...new Set(scopes)].join(" ");
}

/** Domyślny zestaw dla Bike Stats: lista aktywności i pobieranie plików FIT. */
export const HAMMERHEAD_DEFAULT_AUTHORIZE_SCOPES = [
    HAMMERHEAD_OAUTH_SCOPES.activity.read,
] satisfies readonly HammerheadOAuthScope[];

export const HAMMERHEAD_DEFAULT_AUTHORIZE_SCOPE = joinHammerheadOAuthScopes([
    HAMMERHEAD_OAUTH_SCOPES.activity.read,
]);

export type HammerheadAuthResponse = {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
};

export type HammerheadTokens = {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
};

/** Znormalizowany wpis listy aktywności (API może zwracać inne nazwy pól). */
export type HammerheadActivityListItem = {
    id: string;
    name: string;
    startedAt: string | null;
    distanceMeters: number;
};

export type HammerheadActivitiesApiResponse = {
    activities: HammerheadActivityListItem[];
};
