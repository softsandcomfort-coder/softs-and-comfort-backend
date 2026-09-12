/**
 * CORS for the handful of endpoints the storefront may call.
 *
 * The storefront is a static SPA on a different origin, so these are the only
 * routes reachable without an admin session. Each one is locked to the
 * configured storefront origin and returns deliberately minimal data.
 */

const ALLOWED_ORIGINS = (process.env.STOREFRONT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

export function corsHeaders(origin: string | null): Record<string, string> {
    const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        "Access-Control-Allow-Origin": allowed,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        Vary: "Origin",
    };
}

export function isOriginAllowed(origin: string | null): boolean {
    // same-origin and server-to-server requests send no Origin header
    return !origin || ALLOWED_ORIGINS.includes(origin);
}
