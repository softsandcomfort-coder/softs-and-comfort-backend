import { NextResponse } from "next/server";
import { catalogClient } from "@/lib/sanity/client";
import { createOrder, type OrderLine } from "@/lib/sanity/orders";

/**
 * Public checkout endpoint — the one route the storefront may write through.
 *
 * The storefront is a static SPA and cannot hold a Sanity token, so order
 * creation has to go through here. Two rules follow from it being unauthenticated:
 *
 *  1. Prices are re-read from Sanity and recomputed server-side. A client-supplied
 *     price is a client-supplied discount, so the request body's prices are ignored
 *     entirely — only product id, quantity, size and colour are taken from it.
 *  2. Only the configured storefront origin gets CORS access.
 */

const ALLOWED_ORIGINS = (process.env.STOREFRONT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

const MAX_LINES = 50;
const MAX_QTY_PER_LINE = 99;

function corsHeaders(origin: string | null): Record<string, string> {
    const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        "Access-Control-Allow-Origin": allowed,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        Vary: "Origin",
    };
}

export async function OPTIONS(req: Request) {
    return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

type IncomingLine = { productId?: unknown; qty?: unknown; size?: unknown; color?: unknown };

export async function POST(req: Request) {
    const origin = req.headers.get("origin");
    const headers = corsHeaders(origin);

    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
        return NextResponse.json({ message: "Origin not allowed" }, { status: 403, headers });
    }

    try {
        const body = await req.json();

        const customerName = String(body.customerName || "").trim();
        const customerEmail = String(body.customerEmail || "").trim().toLowerCase();
        const rawLines: IncomingLine[] = Array.isArray(body.lines) ? body.lines : [];

        if (!customerName) {
            return NextResponse.json({ message: "Name is required" }, { status: 400, headers });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
            return NextResponse.json({ message: "A valid email is required" }, { status: 400, headers });
        }
        if (rawLines.length === 0) {
            return NextResponse.json({ message: "Your cart is empty" }, { status: 400, headers });
        }
        if (rawLines.length > MAX_LINES) {
            return NextResponse.json({ message: "Too many items in one order" }, { status: 400, headers });
        }

        // Collapse to id -> requested qty, ignoring anything price-related.
        const requested = rawLines
            .map((l) => ({
                productId: String(l.productId || ""),
                qty: Math.min(MAX_QTY_PER_LINE, Math.max(1, Number.parseInt(String(l.qty ?? 1), 10) || 1)),
                size: l.size ? String(l.size) : null,
                color: l.color ? String(l.color) : null,
            }))
            .filter((l) => l.productId);

        if (requested.length === 0) {
            return NextResponse.json({ message: "No valid items in the order" }, { status: 400, headers });
        }

        // Authoritative product data straight from the catalogue.
        const products = await catalogClient().fetch<
            { _id: string; title: string; price: number; salePrice: number | null; image: string | null }[]
        >(
            `*[_type == "product" && _id in $ids]{
                _id, title, price, salePrice, "image": images[0].asset->url
            }`,
            { ids: requested.map((l) => l.productId) }
        );

        const byId = new Map(products.map((p) => [p._id, p]));

        const missing = requested.filter((l) => !byId.has(l.productId));
        if (missing.length > 0) {
            return NextResponse.json(
                { message: "Some items are no longer available. Please refresh your cart." },
                { status: 409, headers }
            );
        }

        const lines: OrderLine[] = requested.map((l) => {
            const p = byId.get(l.productId)!;
            const unitPrice = p.salePrice != null && p.salePrice < p.price ? p.salePrice : p.price;
            return {
                productId: p._id,
                title: p.title,
                image: p.image ?? null,
                unitPrice,
                qty: l.qty,
                size: l.size,
                color: l.color,
            };
        });

        const order = await createOrder({
            customerName,
            customerEmail,
            customerPhone: body.customerPhone ? String(body.customerPhone) : undefined,
            shippingAddress:
                body.shippingAddress && typeof body.shippingAddress === "object"
                    ? Object.fromEntries(
                          Object.entries(body.shippingAddress as Record<string, unknown>).map(([k, v]) => [
                              k,
                              String(v ?? ""),
                          ])
                      )
                    : undefined,
            notes: body.notes ? String(body.notes) : undefined,
            lines,
            shippingCost: Number(body.shippingCost) || 0,
            paymentMethod: body.paymentMethod ? String(body.paymentMethod) : "cod",
        });

        return NextResponse.json(
            {
                message: "Order placed",
                order: { orderNumber: order.orderNumber, total: order.total, status: order.status },
            },
            { status: 201, headers }
        );
    } catch (error) {
        console.error("PUBLIC_CREATE_ORDER_ERROR", error);
        return NextResponse.json({ message: "Could not place the order" }, { status: 500, headers });
    }
}
