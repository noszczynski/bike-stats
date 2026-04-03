import { randomBytes } from "node:crypto";

/**
 * RFC 6749 Appendix A.5: `state = 1*VSCHAR` (znaki widoczne US-ASCII 0x20–0x7E).
 * §10.12: niezgadywalna wartość wiązania żądania z sesją (CSRF).
 */
const OAUTH_STATE_VSCHAR = /^[\x20-\x7E]+$/;

const STATE_MIN_BYTES = 16;
const STATE_MAX_LENGTH = 512;

/** `state` zwrócony w redirect URI — ten sam format co generuje {@link createHammerheadOAuthState}. */
export type HammerheadOAuthState = string;

function toBase64Url(bytes: Buffer): string {
    return bytes
        .toString("base64")
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replace(/=+$/, "");
}

/**
 * Generuje losowy, nieprzejrzysty `state` (base64url, min. 128 bitów entropii).
 * Do użycia wyłącznie po stronie serwera (start authorization code flow).
 */
export function createHammerheadOAuthState(): HammerheadOAuthState {
    return toBase64Url(randomBytes(STATE_MIN_BYTES));
}

/**
 * Odrzuca puste / zbyt długie / spoza VSCHAR — przed porównaniem z wartością w cookie.
 */
export function isValidHammerheadOAuthState(value: string | null | undefined): value is string {
    if (value == null || value.length === 0) return false;
    if (value.length > STATE_MAX_LENGTH) return false;
    return OAUTH_STATE_VSCHAR.test(value);
}
