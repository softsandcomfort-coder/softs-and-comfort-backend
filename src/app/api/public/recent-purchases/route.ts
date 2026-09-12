import { NextResponse } from "next/server";
import { adminClient } from "@/lib/sanity/client";
import { corsHeaders, isOriginAllowed } from "@/lib/publicCors";

/**
 * Social-proof feed for the storefront's "recent purchases" popup.
 *
 * Orders live in the private dataset because they carry names, emails, phone
 * numbers and addresses. None of that leaves this route: it projects only the
 * product title, its image, the shipping city and a timestamp. No customer
 * name, no partial name, no initials — the owner chose city-only.
 *
 * Cancelled orders are excluded, and anything older than the window is dropped
 * so the popup cannot imply activity the store has not had.
 */
export async function OPTIONS(req: Request) {
    return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

const MAX_AGE_DAYS = 30;
const LIMIT = 12;

export async function GET(req: Request) {
    const origin = req.headers.get("origin");
    const headers = corsHeaders(origin);

    if (!isOriginAllowed(origin)) {
        return NextResponse.json({ message: "Origin not allowed" }, { status: 403, headers });
    }

    try {
        const since = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

        const purchases = await adminClient().fetch<
            { title: string | null; image: string | null; city: string | null; at: string }[]
        >(
            `*[_type == "order" && status != "cancelled" && createdAt >= $since]
                | order(createdAt desc)[0...$limit] {
                    "title": lines[0].title,
                    "image": lines[0].image,
                    "city": shippingAddress.city,
                    "at": createdAt
                }`,
            { since, limit: LIMIT }
        );

        const items = (purchases ?? [])
            .filter((p) => p.title)
            .map((p) => ({
                title: p.title,
                image: p.image,
                city: p.city || null,
                at: p.at,
            }));

        return NextResponse.json(
            { items },
            {
                status: 200,
                // brief cache: this is decorative, and it keeps the private
                // dataset from being queried on every page load
                headers: { ...headers, "Cache-Control": "public, max-age=60" },
            }
        );
    } catch (error) {
        console.error("PUBLIC_RECENT_PURCHASES_ERROR", error);
        // never fail the storefront over a decorative widget
        return NextResponse.json({ items: [] }, { status: 200, headers });
    }
}
