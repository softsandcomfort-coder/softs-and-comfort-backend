import { NextResponse } from "next/server";
import { consumeResetToken, findUserById, updateUserPassword } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const token = String(body.token || "");
        const password = String(body.password || "");
        const confirmPassword = String(body.confirmPassword || "");

        if (!token || !password || !confirmPassword) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }
        if (password !== confirmPassword) {
            return NextResponse.json({ message: "Confirm password does not match" }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
        }

        const userId = await consumeResetToken(token);
        if (!userId) {
            return NextResponse.json({ message: "Reset link is invalid or expired" }, { status: 400 });
        }

        const user = await findUserById(userId);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        await updateUserPassword(user._id, password);

        return NextResponse.json({ message: "Password reset successful" }, { status: 200 });
    } catch (error) {
        console.error("RESET_PASSWORD_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}
