import { NextResponse } from "next/server";
import { validatePromoCode } from "@/lib/sanity/promo";
import { catalogClient } from "@/lib/sanity/client";
import { corsHeaders, isOriginAllowed } from "@/lib/publicCors";

/**
 * Checks a promo code so the storefront can show the discount before the
 * customer commits.
 *
 * This is a preview only. The order endpoint re-validates the code and
 * recomputes the discount from scratch, so tampering with the response here
 * changes nothing about what is actually charged.
 *
 * The subtotal is recomputed from the cart's product ids rather than trusted,
 * otherwise a fake subtotal could unlock a minimum-spend code.
 */
export async function OPTIONS(req: Request) {
    return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

type IncomingLine = { productId?: unknown; qty?: unknown };

export async function POST(req: Request) {
    const origin = req.headers.get("origin");
    const headers = corsHeaders(origin);

    if (!isOriginAllowed(origin)) {
        return NextResponse.json({ message: "Origin not allowed" }, { status: 403, headers });
    }

    try {
        const body = await req.json();
        const code = String(body.code || "");
        const rawLines: IncomingLine[] = Array.isArray(body.lines) ? body.lines : [];

        const requested = rawLines
            .map((l) => ({
                productId: String(l.productId || ""),
                qty: Math.min(99, Math.max(1, Number.parseInt(String(l.qty ?? 1), 10) || 1)),
            }))
            .filter((l) => l.productId);

        if (requested.length === 0) {
            return NextResponse.json(
                { ok: false, reason: "Your cart is empty" },
                { status: 400, headers }
            );
        }

        const products = await catalogClient().fetch<
            { _id: string; price: number; salePrice: number | null }[]
        >(`*[_type == "product" && _id in $ids]{ _id, price, salePrice }`, {
            ids: requested.map((l) => l.productId),
        });

        const byId = new Map(products.map((p) => [p._id, p]));
        const subtotal = requested.reduce((sum, l) => {
            const p = byId.get(l.productId);
            if (!p) return sum;
            const unit = p.salePrice != null && p.salePrice < p.price ? p.salePrice : p.price;
            return sum + unit * l.qty;
        }, 0);

        const result = await validatePromoCode(code, subtotal);
        return NextResponse.json(result, { status: result.ok ? 200 : 400, headers });
    } catch (error) {
        console.error("PUBLIC_PROMO_ERROR", error);
        return NextResponse.json(
            { ok: false, reason: "Could not check that code" },
            { status: 500, headers }
        );
    }
}
