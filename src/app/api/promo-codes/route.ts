import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/session";
import {
    listPromoCodes,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    type PromoInput,
} from "@/lib/sanity/promo";

async function guard() {
    const session = await getSession();
    if (!can(session, "products")) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return null;
}

function parseBody(body: Record<string, unknown>): PromoInput | { error: string } {
    const code = String(body.code || "").trim();
    if (!/^[A-Za-z0-9-]{3,24}$/.test(code)) {
        return { error: "Code must be 3-24 characters: letters, numbers and hyphens only" };
    }

    const discountType = body.discountType === "fixed" ? "fixed" : "percent";
    const value = Number(body.value);
    if (!Number.isFinite(value) || value <= 0) {
        return { error: "Enter a discount value greater than zero" };
    }
    if (discountType === "percent" && value > 100) {
        return { error: "A percentage discount cannot exceed 100" };
    }

    const minRaw = body.minOrderValue;
    const minOrderValue = minRaw === "" || minRaw == null ? null : Number(minRaw);
    if (minOrderValue != null && (!Number.isFinite(minOrderValue) || minOrderValue < 0)) {
        return { error: "Minimum order value must be a number" };
    }

    const limitRaw = body.usageLimit;
    const usageLimit = limitRaw === "" || limitRaw == null ? null : Number.parseInt(String(limitRaw), 10);
    if (usageLimit != null && (!Number.isFinite(usageLimit) || usageLimit < 1)) {
        return { error: "Usage limit must be a whole number of at least 1" };
    }

    const expiresRaw = body.expiresAt ? String(body.expiresAt) : "";
    let expiresAt: string | null = null;
    if (expiresRaw) {
        const d = new Date(expiresRaw);
        if (Number.isNaN(d.getTime())) return { error: "Expiry date isn't valid" };
        expiresAt = d.toISOString();
    }

    return {
        code,
        discountType,
        value,
        minOrderValue,
        usageLimit,
        expiresAt,
        active: body.active !== false,
    };
}

export async function GET() {
    const denied = await guard();
    if (denied) return denied;
    try {
        return NextResponse.json({ promoCodes: await listPromoCodes() });
    } catch (error) {
        console.error("LIST_PROMO_ERROR", error);
        return NextResponse.json({ message: "Could not load promo codes" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const parsed = parseBody(await req.json());
        if ("error" in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });
        const promo = await createPromoCode(parsed);
        return NextResponse.json({ message: "Promo code created", promo }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Something went wrong";
        console.error("CREATE_PROMO_ERROR", error);
        return NextResponse.json({ message }, { status: 400 });
    }
}

export async function PUT(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const body = await req.json();
        const id = String(body.id || "").trim();
        if (!id) return NextResponse.json({ message: "Promo code id is required" }, { status: 400 });

        const parsed = parseBody(body);
        if ("error" in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });

        await updatePromoCode(id, parsed);
        return NextResponse.json({ message: "Promo code updated" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Something went wrong";
        console.error("UPDATE_PROMO_ERROR", error);
        return NextResponse.json({ message }, { status: 400 });
    }
}

export async function DELETE(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const id = new URL(req.url).searchParams.get("id");
        if (!id) return NextResponse.json({ message: "Promo code id is required" }, { status: 400 });
        await deletePromoCode(id);
        return NextResponse.json({ message: "Promo code deleted" });
    } catch (error) {
        console.error("DELETE_PROMO_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}
