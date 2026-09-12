import { NextResponse } from "next/server";
import { getSession, listUsers, createUser, findUserByEmail, deleteUser, setUserActive } from "@/lib/auth";
import { can } from "@/lib/session";

async function guard() {
    const session = await getSession();
    if (!can(session, "users")) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return null;
}

export async function GET() {
    const denied = await guard();
    if (denied) return denied;
    try {
        return NextResponse.json({ users: await listUsers() });
    } catch (error) {
        console.error("LIST_USERS_ERROR", error);
        return NextResponse.json({ message: "Could not load users" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const body = await req.json();
        const name = String(body.name || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const confirmPassword = String(body.confirmPassword || "");

        if (!name || !email || !password || !confirmPassword) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ message: "Invalid email address" }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
        }
        if (password !== confirmPassword) {
            return NextResponse.json({ message: "Confirm password does not match" }, { status: 400 });
        }
        if (await findUserByEmail(email)) {
            return NextResponse.json({ message: "Email already exists" }, { status: 409 });
        }

        // Only these are enforced by can(); anything else is ignored rather than
        // stored, so the UI can never imply a permission the server does not check.
        const VALID_PERMISSIONS = ["products", "categories", "orders", "users", "settings"];
        const rawPermissions = body.permissions;
        const requested = Array.isArray(rawPermissions)
            ? rawPermissions.map(String)
            : rawPermissions && typeof rawPermissions === "object"
              ? // legacy object map: treat only an explicit "allow" as a grant.
                // Boolean("deny") is true, so a truthiness check granted everything.
                Object.entries(rawPermissions as Record<string, unknown>)
                    .filter(([, v]) => v === true || v === "allow")
                    .map(([k]) => k)
              : [];
        const permissions = requested.filter((p) => VALID_PERMISSIONS.includes(p));

        const user = await createUser({
            name,
            email,
            password,
            role: body.role === "owner" ? "owner" : "staff",
            permissions,
        });

        return NextResponse.json({ message: "User created", user }, { status: 201 });
    } catch (error) {
        console.error("CREATE_USER_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const body = await req.json();
        const id = String(body.id || "").trim();
        if (!id) return NextResponse.json({ message: "User id is required" }, { status: 400 });
        await setUserActive(id, Boolean(body.active));
        return NextResponse.json({ message: "User updated" });
    } catch (error) {
        console.error("UPDATE_USER_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const id = new URL(req.url).searchParams.get("id");
        if (!id) return NextResponse.json({ message: "User id is required" }, { status: 400 });

        // Locking yourself out of the dashboard is never the intent.
        const session = await getSession();
        if (session?.sub === id) {
            return NextResponse.json({ message: "You cannot delete your own account" }, { status: 400 });
        }

        await deleteUser(id);
        return NextResponse.json({ message: "User deleted" });
    } catch (error) {
        console.error("DELETE_USER_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}
