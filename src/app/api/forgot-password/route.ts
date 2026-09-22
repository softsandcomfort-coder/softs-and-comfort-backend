import { NextResponse } from "next/server";
import { findUserByEmail, createResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rateLimit";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const email = String(body.email || "").trim().toLowerCase();

        // Always the same response, so this cannot be used to discover which
        // email addresses have accounts.
        const genericOk = NextResponse.json(
            { message: "If the email exists, a reset link will be sent." },
            { status: 200 }
        );

        if (!email) return genericOk;

        // Without a limit this mails-bombs the owner, and because a new token
        // invalidates the previous one, repeated requests also stop the owner
        // from ever completing a reset.
        const perEmail = rateLimit(`reset:email:${email}`, 3, 60 * 60 * 1000);
        if (!perEmail.ok) {
            return tooManyRequests("Too many reset requests. Try again later.", perEmail.retryAfter);
        }
        const perIp = rateLimit(`reset:ip:${clientIp(req)}`, 10, 60 * 60 * 1000);
        if (!perIp.ok) {
            return tooManyRequests("Too many reset requests. Try again later.", perIp.retryAfter);
        }

        const user = await findUserByEmail(email);
        if (!user || user.active === false) return genericOk;

        const rawToken = await createResetToken(user._id);

        const appUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.NODE_ENV === "production" ? "https://admin.softandcomfort.com" : "http://localhost:3000");
        const resetLink = `${appUrl}/reset-password?token=${rawToken}`;

        try {
            await sendPasswordResetEmail(email, resetLink);
        } catch (mailError) {
            // SMTP is optional in development — log the link so the flow is still testable
            console.error("MAIL_ERROR", mailError);
            console.log("RESET LINK (mail failed):", resetLink);
        }

        return genericOk;
    } catch (error) {
        console.error("FORGOT_PASSWORD_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}
