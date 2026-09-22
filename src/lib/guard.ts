import "server-only";
import { redirect } from "next/navigation";
import { requireSession } from "./auth";
import { can } from "./session";

/**
 * Page-level authorisation.
 *
 * The API routes have always checked permissions, but the page components
 * fetched their data straight from Sanity — so a staff account with only
 * "products" could open /order-list or /all-user by typing the URL and read
 * every customer's address, the revenue figures and the admin roster. Every
 * page that shows restricted data now starts with one of these.
 *
 * `requireSession` is cached per request, so several calls cost one read.
 */

/**
 * Just "must be signed in with an account that still exists".
 *
 * The middleware only verifies the cookie signature, so a cookie for an
 * account that was deleted — or that belongs to a different Sanity project —
 * passes it and then renders an empty page. This sends it back to sign in.
 */
export async function requireAuth(): Promise<void> {
    if (!(await requireSession())) redirect("/login");
}

/** Redirects to the dashboard unless the signed-in account holds `permission`. */
export async function requirePermission(permission: string): Promise<void> {
    const session = await requireSession();
    if (!session) redirect("/login");
    if (!can(session, permission)) redirect("/no-access");
}

/** Redirects unless the signed-in account is an owner. */
export async function requireOwner(): Promise<void> {
    const session = await requireSession();
    if (!session) redirect("/login");
    if (session.role !== "owner") redirect("/no-access");
}

/** True when the account holds the permission — for hiding menu entries. */
export async function hasPermission(permission: string): Promise<boolean> {
    return can(await requireSession(), permission);
}
