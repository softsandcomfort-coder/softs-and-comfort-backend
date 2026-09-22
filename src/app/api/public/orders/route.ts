import { NextResponse } from "next/server";
import { catalogClient } from "@/lib/sanity/client";
import { createOrder, type OrderLine } from "@/lib/sanity/orders";
import { validatePromoCode, incrementPromoUsage } from "@/lib/sanity/promo";
import { checkStock } from "@/lib/sanity/stock";
import { corsHeaders, isOriginAllowed } from "@/lib/publicCors";
import { sendOrderConfirmationEmail, isMailConfigured } from "@/lib/mailer";
import { customerWhatsAppText, whatsAppLink } from "@/lib/orderMessage";
import { getStoreSettings } from "@/lib/sanity/catalog";

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

const MAX_LINES = 50;
const MAX_QTY_PER_LINE = 99;

export async function OPTIONS(req: Request) {
    return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

type IncomingLine = { productId?: unknown; qty?: unknown; size?: unknown; color?: unknown };

export async function POST(req: Request) {
    const origin = req.headers.get("origin");
    const headers = corsHeaders(origin);

    if (!isOriginAllowed(origin)) {
        return NextResponse.json({ message: "Origin not allowed" }, { status: 403, headers });
    }

    try {
        const body = await req.json();

        const customerName = String(body.customerName || "").trim();
        const customerEmail = String(body.customerEmail || "").trim().toLowerCase();
        const customerPhone = String(body.customerPhone || "").trim();
        const rawLines: IncomingLine[] = Array.isArray(body.lines) ? body.lines : [];

        if (!customerName) {
            return NextResponse.json({ message: "Name is required" }, { status: 400, headers });
        }
        // Phone is the required contact: orders are confirmed over WhatsApp and
        // paid cash on delivery, so a number is what actually reaches a customer.
        if (customerPhone.replace(/[^0-9]/g, "").length < 10) {
            return NextResponse.json(
                { message: "A valid phone number is required" },
                { status: 400, headers }
            );
        }
        // Email is optional, but must be valid when supplied.
        if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
            return NextResponse.json(
                { message: "That email address isn't valid" },
                { status: 400, headers }
            );
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

        // Refuse to oversell. Checked here rather than trusted from the cart,
        // which may have been sitting in a browser since before the last sale.
        const stock = await checkStock(
            lines.map((l) => ({ productId: l.productId, qty: l.qty }))
        );
        if (!stock.ok) {
            return NextResponse.json(
                { message: stock.message, shortfalls: stock.shortfalls },
                { status: 409, headers }
            );
        }

        // Re-validate the promo code against the server-computed subtotal. The
        // request says which code was typed, never what it is worth.
        const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
        const rawPromo = String(body.promoCode || "").trim();
        let discount = 0;
        let appliedCode: string | null = null;
        let promoId: string | null = null;

        if (rawPromo) {
            const promo = await validatePromoCode(rawPromo, subtotal);
            if (!promo.ok) {
                return NextResponse.json({ message: promo.reason }, { status: 400, headers });
            }
            discount = promo.discount;
            appliedCode = promo.code;
            promoId = promo.promoId;
        }

        const order = await createOrder({
            customerName,
            customerEmail,
            customerPhone,
            discount,
            promoCode: appliedCode,
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
            // never taken from the request: a negative value would lower the
            // order total. Delivery is free until shipping rules are implemented.
            shippingCost: 0,
            paymentMethod: body.paymentMethod ? String(body.paymentMethod) : "cod",
        });

        // only counts a redemption once the order actually exists
        if (promoId) await incrementPromoUsage(promoId);

        const settings = (await getStoreSettings().catch(() => ({}))) as {
            storeName?: string;
            whatsappNumber?: string;
        };
        const storeName = settings.storeName || "Soft & Comfort";

        // Courtesy email. Best-effort by design: the order already exists, so a
        // missing SMTP config or a bounced send must not fail the request.
        if (customerEmail && isMailConfigured()) {
            try {
                await sendOrderConfirmationEmail(customerEmail, order, storeName);
            } catch (mailError) {
                console.error("ORDER_CONFIRMATION_MAIL_ERROR", order.orderNumber, mailError);
            }
        }

        // One-tap WhatsApp confirmation for the customer. Automated sending would
        // need the WhatsApp Business API; a pre-filled click-to-chat link needs
        // nothing and reaches the channel this store actually runs on.
        const whatsappUrl = whatsAppLink(
            settings.whatsappNumber,
            customerWhatsAppText(order, storeName)
        );

        return NextResponse.json(
            {
                message: "Order placed",
                order: {
                    orderNumber: order.orderNumber,
                    total: order.total,
                    discount: order.discount,
                    status: order.status,
                },
                whatsappUrl,
                emailSent: Boolean(customerEmail && isMailConfigured()),
            },
            { status: 201, headers }
        );
    } catch (error) {
        console.error("PUBLIC_CREATE_ORDER_ERROR", error);
        return NextResponse.json({ message: "Could not place the order" }, { status: 500, headers });
    }
}
