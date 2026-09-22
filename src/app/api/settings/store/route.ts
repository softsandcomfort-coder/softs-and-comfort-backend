import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/session";
import { getStoreSettings, saveStoreSettings } from "@/lib/sanity/catalog";

/**
 * Store settings live in the PUBLIC catalogue dataset as the `siteSettings`
 * singleton, so the storefront can read them (currency, contact details,
 * shipping thresholds) without a token.
 */
async function guard() {
    const session = await requireSession();
    if (!can(session, "settings")) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return null;
}

export async function GET() {
    const denied = await guard();
    if (denied) return denied;
    try {
        return NextResponse.json(await getStoreSettings());
    } catch (error) {
        console.error("GET_STORE_SETTINGS_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const body = await req.json();
        // strip document plumbing the client may have echoed back
        const { _id, _type, _rev, _createdAt, _updatedAt, ...data } = body;
        void _id; void _type; void _rev; void _createdAt; void _updatedAt;
        await saveStoreSettings(data);
        return NextResponse.json({ message: "Store settings saved" });
    } catch (error) {
        console.error("SAVE_STORE_SETTINGS_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}
