import { NextResponse } from "next/server";
import {
    findUserByEmail,
    verifyPassword,
    startSession,
    isLockedOut,
    recordFailedLogin,
    clearFailedLogins,
    equalisePasswordTiming,
} from "@/lib/auth";
import { rateLimit, clearRateLimit, clientIp, tooManyRequests } from "@/lib/rateLimit";

type LoginBody = {
    email?: string;
    password?: string;
    keepSignedIn?: boolean;
};

/** Per-IP and per-email ceilings, on top of the account lockout in Sanity. */
const IP_LIMIT = 10;
const EMAIL_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as LoginBody;

        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");

        if (!email || !password) {
            return NextResponse.json({ message: "Please enter email and password" }, { status: 400 });
        }

        // Unlimited guessing was possible before this: no counter, no lockout,
        // and each attempt costs a bcrypt(12) comparison, so it doubled as a
        // cheap way to exhaust the server's CPU.
        const ip = clientIp(req);
        const byIp = rateLimit(`login:ip:${ip}`, IP_LIMIT, WINDOW_MS);
        if (!byIp.ok) {
            return tooManyRequests("Too many sign-in attempts. Try again shortly.", byIp.retryAfter);
        }
        const byEmail = rateLimit(`login:email:${email}`, EMAIL_LIMIT, WINDOW_MS);
        if (!byEmail.ok) {
            return tooManyRequests("Too many sign-in attempts. Try again shortly.", byEmail.retryAfter);
        }

        const user = await findUserByEmail(email);

        // Same message and shape whether the account is missing, deactivated or
        // the password is wrong — otherwise this endpoint enumerates accounts.
        const invalid = NextResponse.json({ message: "Email or password is incorrect" }, { status: 401 });

        if (!user || !user.passwordHash || user.active === false) {
            // burn the same time a real comparison would, so the response time
            // does not reveal which emails have accounts
            await equalisePasswordTiming(password);
            return invalid;
        }

        if (isLockedOut(user)) {
            return tooManyRequests(
                "Too many failed attempts. This account is locked for a few minutes.",
                15 * 60
            );
        }

        if (!(await verifyPassword(password, user.passwordHash))) {
            await recordFailedLogin(user);
            return invalid;
        }

        await clearFailedLogins(user);
        clearRateLimit(`login:email:${email}`);
        clearRateLimit(`login:ip:${ip}`);

        await startSession(user, Boolean(body.keepSignedIn));

        return NextResponse.json({
            message: "Login successful",
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error) {
        console.error("LOGIN_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}
