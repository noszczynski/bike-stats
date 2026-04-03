import { getHammerheadConfigFromEnv } from "@/env/env-server";
import {
    HAMMERHEAD_DEFAULT_AUTHORIZE_SCOPE,
    joinHammerheadOAuthScopes,
    type HammerheadActivityListItem,
    type HammerheadAuthResponse,
    type HammerheadOAuthScope,
    type HammerheadTokens,
} from "@/types/hammerhead";

const HAMMERHEAD_API_BASE = "https://api.hammerhead.io/v1";

/** Ścieżki OAuth zgodne z oficjalnym SDK: v1/auth/oauth/… (nie v1/oauth/…). */
const HAMMERHEAD_OAUTH_AUTHORIZE_URL = `${HAMMERHEAD_API_BASE}/auth/oauth/authorize`;
const HAMMERHEAD_OAUTH_TOKEN_URL = `${HAMMERHEAD_API_BASE}/auth/oauth/token`;

function callbackUri(): string {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";
    return `${base}/api/hammerhead/callback`;
}

function getClientCredentials() {
    const config = getHammerheadConfigFromEnv();
    if (!config) {
        throw new Error("Hammerhead API is not configured");
    }
    return config;
}

function tokenEndpoint() {
    return HAMMERHEAD_OAUTH_TOKEN_URL;
}

export function buildHammerheadAuthorizeUrl(params: {
    state: string;
    /** Domyślnie {@link HAMMERHEAD_DEFAULT_AUTHORIZE_SCOPE} (np. `activity:read`). */
    scopes?: readonly HammerheadOAuthScope[];
}): string {
    const { clientId } = getClientCredentials();

    const scopeParam =
        params.scopes !== undefined && params.scopes.length > 0
            ? joinHammerheadOAuthScopes(params.scopes)
            : HAMMERHEAD_DEFAULT_AUTHORIZE_SCOPE;

    const url = new URL(HAMMERHEAD_OAUTH_AUTHORIZE_URL);

    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", callbackUri());
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", params.state);
    url.searchParams.set("scope", scopeParam);

    return url.toString();
}

export async function exchangeCodeForToken(code: string): Promise<HammerheadAuthResponse> {
    const { clientId, clientSecret } = getClientCredentials();
    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUri(),
    });

    const response = await fetch(tokenEndpoint(), {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
        },
        body: body.toString(),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
            `Hammerhead token exchange failed: ${response.status} ${text.slice(0, 200)}`,
        );
    }

    return response.json() as Promise<HammerheadAuthResponse>;
}

export async function refreshHammerheadToken(refreshToken: string): Promise<HammerheadTokens> {
    const { clientId, clientSecret } = getClientCredentials();
    const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
    });

    const response = await fetch(tokenEndpoint(), {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
        },
        body: body.toString(),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
            `Hammerhead token refresh failed: ${response.status} ${text.slice(0, 200)}`,
        );
    }

    return response.json() as Promise<HammerheadTokens>;
}

export function normalizeHammerheadActivitiesPayload(
    payload: unknown,
): HammerheadActivityListItem[] {
    const rawItems: unknown[] = Array.isArray(payload)
        ? payload
        : typeof payload === "object" && payload !== null && "data" in payload
          ? ((payload as { data: unknown[] }).data ?? [])
          : typeof payload === "object" && payload !== null && "activities" in payload
            ? ((payload as { activities: unknown[] }).activities ?? [])
            : [];

    return rawItems
        .map((raw: unknown) => {
            if (!raw || typeof raw !== "object") return null;
            const o = raw as Record<string, unknown>;
            const id = o.id ?? o.activity_id ?? o.uuid;
            if (id === undefined || id === null) return null;
            const name = o.name ?? o.title ?? "Aktywność";
            const started =
                o.started_at ?? o.start_time ?? o.startedAt ?? o.date ?? o.created_at ?? null;
            const dist =
                o.distance_meters ??
                o.distance_m ??
                o.distance ??
                (typeof o.total_distance === "number" ? o.total_distance : null);

            let distanceMeters = 0;
            if (typeof dist === "number" && !Number.isNaN(dist)) {
                distanceMeters = dist;
            }

            return {
                id: String(id),
                name: String(name),
                startedAt: typeof started === "string" ? started : null,
                distanceMeters,
            } satisfies HammerheadActivityListItem;
        })
        .filter((x): x is HammerheadActivityListItem => x !== null);
}

async function fetchHammerheadJson(
    path: string,
    accessToken: string,
    init?: RequestInit,
): Promise<Response> {
    const url = path.startsWith("http")
        ? path
        : `${HAMMERHEAD_API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
    return fetch(url, {
        ...init,
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
            ...(init?.headers ?? {}),
        },
    });
}

export type HammerheadFetchResult<T> = {
    data: T;
    /** Jeśli odświeżono token, ustaw te ciasteczka w odpowiedzi NextResponse */
    refreshedTokens?: { access_token: string; refresh_token: string };
};

/**
 * Wykonuje żądanie z Bearer; przy 401 próbuje odświeżyć token (jak Strava).
 */
export async function hammerheadAuthorizedJson<T>(
    accessToken: string | undefined,
    refreshToken: string | undefined,
    path: string,
    init?: RequestInit,
): Promise<HammerheadFetchResult<T>> {
    if (!accessToken) {
        throw new Error("Missing Hammerhead access token");
    }

    let response = await fetchHammerheadJson(path, accessToken, init);
    if (response.status === 401 && refreshToken) {
        const newTokens = await refreshHammerheadToken(refreshToken);
        const nextRefresh = newTokens.refresh_token ?? refreshToken;
        response = await fetchHammerheadJson(path, newTokens.access_token, init);
        if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(
                `Hammerhead request failed after refresh: ${response.status} ${text.slice(0, 200)}`,
            );
        }
        const data = (await response.json()) as T;
        return {
            data,
            refreshedTokens: {
                access_token: newTokens.access_token,
                refresh_token: nextRefresh,
            },
        };
    }

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Hammerhead request failed: ${response.status} ${text.slice(0, 200)}`);
    }

    const data = (await response.json()) as T;
    return { data };
}

export async function hammerheadAuthorizedBinary(
    accessToken: string | undefined,
    refreshToken: string | undefined,
    path: string,
): Promise<{
    buffer: ArrayBuffer;
    refreshedTokens?: { access_token: string; refresh_token: string };
}> {
    if (!accessToken) {
        throw new Error("Missing Hammerhead access token");
    }

    const url = path.startsWith("http")
        ? path
        : `${HAMMERHEAD_API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

    let response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "*/*",
        },
    });

    if (response.status === 401 && refreshToken) {
        const newTokens = await refreshHammerheadToken(refreshToken);
        const nextRefresh = newTokens.refresh_token ?? refreshToken;
        response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${newTokens.access_token}`,
                Accept: "*/*",
            },
        });
        if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(
                `Hammerhead binary request failed after refresh: ${response.status} ${text.slice(0, 200)}`,
            );
        }
        return {
            buffer: await response.arrayBuffer(),
            refreshedTokens: {
                access_token: newTokens.access_token,
                refresh_token: nextRefresh,
            },
        };
    }

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
            `Hammerhead binary request failed: ${response.status} ${text.slice(0, 200)}`,
        );
    }

    return { buffer: await response.arrayBuffer() };
}

/** Lista aktywności — ścieżka zgodna z dokumentacją v1 `/activities`. */
export async function fetchHammerheadActivities(
    accessToken: string | undefined,
    refreshToken: string | undefined,
    searchParams?: Record<string, string>,
): Promise<HammerheadFetchResult<unknown>> {
    const qs = new URLSearchParams(searchParams ?? {});
    if (!qs.has("per_page")) qs.set("per_page", "50");
    const path = `/activities?${qs.toString()}`;
    return hammerheadAuthorizedJson<unknown>(accessToken, refreshToken, path);
}

export async function downloadHammerheadFitFile(
    hammerheadActivityId: string,
    accessToken: string | undefined,
    refreshToken: string | undefined,
): Promise<{
    buffer: ArrayBuffer;
    refreshedTokens?: { access_token: string; refresh_token: string };
}> {
    const path = `/activities/${encodeURIComponent(hammerheadActivityId)}/fit`;
    return hammerheadAuthorizedBinary(accessToken, refreshToken, path);
}
