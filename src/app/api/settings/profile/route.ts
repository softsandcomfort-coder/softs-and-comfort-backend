import { NextResponse } from "next/server";
import { requireSession, getCurrentUser, updateUserPassword, findUserByEmail } from "@/lib/auth";
import { adminClient } from "@/lib/sanity/client";

/**
 * The signed-in user's own profile. Unlike store settings this is per-account,
 * so it is stored on the adminUser document in the private dataset.
 */
export async function GET() {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    return NextResponse.json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions ?? [],
    });
}

export async function PUT(req: Request) {
    const session = await requireSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const patch: Record<string, unknown> = {};

        if (body.name) patch.name = String(body.name).trim();

        if (body.email) {
            const email = String(body.email).trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return NextResponse.json({ message: "Invalid email address" }, { status: 400 });
            }
            const clash = await findUserByEmail(email);
            if (clash && clash._id !== session.sub) {
                return NextResponse.json({ message: "Email already in use" }, { status: 409 });
            }
            patch.email = email;
        }

        if (Object.keys(patch).length > 0) {
            await adminClient().patch(session.sub).set(patch).commit();
        }

        // Optional password change, guarded by the current password.
        if (body.newPassword) {
            const newPassword = String(body.newPassword);
            if (newPassword.length < 8) {
                return NextResponse.json(
                    { message: "New password must be at least 8 characters" },
                    { status: 400 }
                );
            }
            const user = await getCurrentUser();
            if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

            const bcrypt = (await import("bcryptjs")).default;
            const currentOk = await bcrypt.compare(String(body.currentPassword || ""), user.passwordHash);
            if (!currentOk) {
                return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 });
            }
            await updateUserPassword(session.sub, newPassword);
        }

        return NextResponse.json({ message: "Profile saved" });
    } catch (error) {
        console.error("SAVE_PROFILE_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}
