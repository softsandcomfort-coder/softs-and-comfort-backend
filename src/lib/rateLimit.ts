import "server-only";

/**
 * Small in-process rate limiter.
 *
 * Serverless instances come and go, so this is a speed bump rather than a
 * guarantee: it stops a single client hammering one instance, which is what a
 * password-guessing script or an order flood actually looks like. The durable
 * half of the defence lives in Sanity — failed-login lockout on the account
 * itself, and an order count per phone number — so an attacker who reaches a
 * fresh instance still hits those.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

/** Drops expired buckets so the map cannot grow without bound. */
function sweep(now: number) {
    if (now - lastSweep < 60_000) return;
    lastSweep = now;
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
}

export type RateLimitResult = {
    ok: boolean;
    /** Seconds until the window resets — for the Retry-After header. */
    retryAfter: number;
};

/**
 * Counts one hit against `key`. Returns ok:false once `limit` hits have
 * happened inside `windowMs`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    sweep(now);

    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { ok: true, retryAfter: 0 };
    }

    bucket.count += 1;
    if (bucket.count > limit) {
        return { ok: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
    }
    return { ok: true, retryAfter: 0 };
}

/** Clears a key after a success, so a correct password resets the counter. */
export function clearRateLimit(key: string): void {
    buckets.delete(key);
}

/**
 * Best-effort client address. Vercel sets x-forwarded-for; the first entry is
 * the client. Falls back to a constant, which simply makes the limit global.
 */
export function clientIp(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]!.trim();
    return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function tooManyRequests(message: string, retryAfter: number) {
    return new Response(JSON.stringify({ message }), {
        status: 429,
        headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
        },
    });
}
