import { SignJWT, jwtVerify } from "jose";

/**
 * Signed admin session.
 *
 * The previous implementation stored the raw user id in the cookie and the
 * middleware only checked that *some* value was present — so any request
 * carrying `admin_token=anything` was treated as authenticated. This replaces
 * that with an HMAC-signed JWT that is verified on every request.
 *
 * `jose` is used rather than `jsonwebtoken` because Next.js middleware runs on
 * the Edge runtime, where Node's crypto module is unavailable.
 */

export const SESSION_COOKIE = "admin_session";

export type SessionPayload = {
    /** adminUser document id */
    sub: string;
    email: string;
    role: "owner" | "staff";
    permissions: string[];
    /** seconds since the epoch; compared against the account's sessionsValidFrom */
    issuedAt?: number;
};

function secretKey(): Uint8Array {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error(
            "SESSION_SECRET is missing or too short (needs 32+ characters). Generate one with:\n" +
                '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"'
        );
    }
    return new TextEncoder().encode(secret);
}

export async function createSessionToken(
    payload: SessionPayload,
    maxAgeSeconds: number
): Promise<string> {
    return new SignJWT({
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(payload.sub)
        .setIssuedAt()
        .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSeconds)
        .sign(secretKey());
}

/** Returns the payload, or null when the token is missing, tampered with or expired. */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
        if (!payload.sub) return null;
        return {
            sub: payload.sub,
            email: String(payload.email ?? ""),
            role: payload.role === "owner" ? "owner" : "staff",
            permissions: Array.isArray(payload.permissions) ? (payload.permissions as string[]) : [],
            issuedAt: typeof payload.iat === "number" ? payload.iat : undefined,
        };
    } catch {
        // bad signature, expired, malformed — all mean "not signed in"
        return null;
    }
}

/** Owners bypass the permission list; staff must hold the named permission. */
export function can(session: SessionPayload | null, permission: string): boolean {
    if (!session) return false;
    if (session.role === "owner") return true;
    return session.permissions.includes(permission);
}
