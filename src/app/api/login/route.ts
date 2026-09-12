import { NextResponse } from "next/server";
import { findUserByEmail, verifyPassword, startSession } from "@/lib/auth";

type LoginBody = {
    email?: string;
    password?: string;
    keepSignedIn?: boolean;
};

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as LoginBody;

        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");

        if (!email || !password) {
            return NextResponse.json({ message: "Please enter email and password" }, { status: 400 });
        }

        const user = await findUserByEmail(email);

        // Same message and shape whether the account is missing, deactivated or
        // the password is wrong — otherwise this endpoint enumerates accounts.
        const invalid = NextResponse.json({ message: "Email or password is incorrect" }, { status: 401 });

        if (!user || !user.passwordHash || user.active === false) return invalid;
        if (!(await verifyPassword(password, user.passwordHash))) return invalid;

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
