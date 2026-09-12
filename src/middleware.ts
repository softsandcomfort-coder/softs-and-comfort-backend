import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/**
 * Routes reachable without a session.
 *
 * Note that `/register` is NOT here any more. It used to be public, and
 * `/api/register` wrote straight into the users table — meaning anyone who
 * could reach the app could mint themselves an admin account. Accounts are now
 * created either by an existing owner, or by `npm run create:admin` for the
 * very first one.
 */
const PUBLIC_PAGE_PREFIXES = ["/login", "/forgot-password", "/reset-password"];

const PUBLIC_API_PREFIXES = [
    "/api/login",
    "/api/forgot-password",
    "/api/reset-password",
    "/api/logout",
    // storefront checkout — unauthenticated by necessity, but it recomputes
    // every price server-side and is CORS-locked to the storefront origin
    "/api/public",
];

function isPublic(pathname: string): boolean {
    return (
        PUBLIC_PAGE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
        PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
    );
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Sanity Studio authenticates against Sanity itself and needs its own
    // login/CORS callbacks to pass through unredirected.
    if (pathname.startsWith("/api/auth")) return NextResponse.next();

    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token);

    if (isPublic(pathname)) {
        // Send already-signed-in users away from the auth pages
        if (!pathname.startsWith("/api/") && session) {
            return NextResponse.redirect(new URL("/", req.url));
        }
        return NextResponse.next();
    }

    if (!session) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("from", pathname);
        const res = NextResponse.redirect(loginUrl);
        // clear a stale or tampered cookie so it stops being sent
        if (token) res.cookies.delete(SESSION_COOKIE);
        return res;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|uploads/).*)"],
};
