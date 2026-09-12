import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { randomUUID, randomBytes, createHash } from "crypto";
import { adminClient } from "./sanity/client";
import { SESSION_COOKIE, createSessionToken, verifySessionToken, type SessionPayload } from "./session";

/**
 * Admin accounts, backed by the private Sanity dataset.
 *
 * Replaces the previous SQLite implementation. Password hashes live in the
 * `admin` dataset, which has a private ACL — unlike the catalogue dataset, it
 * cannot be read without a token.
 */

export type AdminUser = {
    _id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: "owner" | "staff";
    permissions: string[];
    active: boolean;
};

const USER_FIELDS = `{ _id, name, email, passwordHash, role, permissions, active }`;

export async function findUserByEmail(email: string): Promise<AdminUser | null> {
    return adminClient().fetch<AdminUser | null>(
        `*[_type == "adminUser" && email == $email][0] ${USER_FIELDS}`,
        { email: email.trim().toLowerCase() }
    );
}

export async function findUserById(id: string): Promise<AdminUser | null> {
    return adminClient().fetch<AdminUser | null>(
        `*[_type == "adminUser" && _id == $id][0] ${USER_FIELDS}`,
        { id }
    );
}

export async function listUsers(): Promise<Omit<AdminUser, "passwordHash">[]> {
    return adminClient().fetch(
        `*[_type == "adminUser"] | order(createdAt desc) { _id, name, email, role, permissions, active, createdAt }`
    );
}

export async function createUser(input: {
    name: string;
    email: string;
    password: string;
    role?: "owner" | "staff";
    permissions?: string[];
}): Promise<Omit<AdminUser, "passwordHash">> {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const doc = await adminClient().create({
        _type: "adminUser",
        name: input.name,
        email: input.email.trim().toLowerCase(),
        passwordHash,
        role: input.role ?? "staff",
        permissions: input.permissions ?? [],
        active: true,
        createdAt: new Date().toISOString(),
    });
    return {
        _id: doc._id,
        name: input.name,
        email: input.email.trim().toLowerCase(),
        role: input.role ?? "staff",
        permissions: input.permissions ?? [],
        active: true,
    };
}

export async function updateUserPassword(userId: string, password: string): Promise<void> {
    const passwordHash = await bcrypt.hash(password, 12);
    await adminClient().patch(userId).set({ passwordHash }).commit();
}

export async function setUserActive(userId: string, active: boolean): Promise<void> {
    await adminClient().patch(userId).set({ active }).commit();
}

export async function deleteUser(userId: string): Promise<void> {
    await adminClient().delete(userId);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ─── Session helpers ─────────────────────────────────────────────────────────

const DAY = 60 * 60 * 24;

export async function startSession(user: AdminUser, keepSignedIn: boolean): Promise<void> {
    const maxAge = keepSignedIn ? DAY * 30 : DAY;
    const token = await createSessionToken(
        {
            sub: user._id,
            email: user.email,
            role: user.role,
            permissions: user.permissions ?? [],
        },
        maxAge
    );
    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge,
    });
}

export async function endSession(): Promise<void> {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
}

/** The current session, verified. Returns null when signed out. */
export async function getSession(): Promise<SessionPayload | null> {
    const store = await cookies();
    return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/**
 * Re-reads the account behind the session so a deactivated or deleted user
 * loses access immediately, without waiting for their JWT to expire.
 */
export async function getCurrentUser(): Promise<AdminUser | null> {
    const session = await getSession();
    if (!session) return null;
    const user = await findUserById(session.sub);
    if (!user || user.active === false) return null;
    return user;
}

// ─── Password reset ──────────────────────────────────────────────────────────

const RESET_TTL_MS = 15 * 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Returns the raw token to email; only its hash is stored. */
export async function createResetToken(userId: string): Promise<string> {
    const client = adminClient();
    const raw = randomBytes(32).toString("hex");

    // one live token per user: drop any earlier ones first
    const existing = await client.fetch<{ _id: string }[]>(
        `*[_type == "passwordResetToken" && user._ref == $userId]{_id}`,
        { userId }
    );
    if (existing.length > 0) {
        await existing.reduce((tx, doc) => tx.delete(doc._id), client.transaction()).commit();
    }

    await client.create({
        _type: "passwordResetToken",
        _id: `reset-${randomUUID()}`,
        user: { _type: "reference", _ref: userId },
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
    });

    return raw;
}

/** Validates and consumes a reset token, returning the user id it belonged to. */
export async function consumeResetToken(raw: string): Promise<string | null> {
    const client = adminClient();
    const record = await client.fetch<{ _id: string; userId: string; expiresAt: string } | null>(
        `*[_type == "passwordResetToken" && tokenHash == $hash][0]{ _id, "userId": user._ref, expiresAt }`,
        { hash: hashToken(raw) }
    );
    if (!record) return null;

    // single-use: burn it whether or not it had expired
    await client.delete(record._id);

    if (new Date(record.expiresAt).getTime() < Date.now()) return null;
    return record.userId;
}
