import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/session";
import { catalogClient } from "@/lib/sanity/client";

/**
 * Generates the next free SKU: SC-<CAT>-<0001>.
 *
 * The sequence comes from the highest number already in use for that prefix
 * rather than a product count, so deleting a product never causes a new one to
 * reuse its code. Uniqueness is then confirmed against the catalogue before the
 * value is handed back.
 */

/** Three-letter prefix from the category, e.g. "Lingerie Sets" -> LIN. */
function prefixFor(name: string | null | undefined): string {
    if (!name) return "GEN";
    const letters = name.replace(/[^A-Za-z]/g, "").toUpperCase();
    return (letters.slice(0, 3) || "GEN").padEnd(3, "X");
}

export async function GET(req: Request) {
    const session = await requireSession();
    if (!can(session, "products")) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    try {
        const categoryId = new URL(req.url).searchParams.get("categoryId");

        const categoryName = categoryId
            ? await catalogClient().fetch<string | null>(
                  `*[_type == "category" && _id == $id][0].name`,
                  { id: categoryId }
              )
            : null;

        const prefix = `SC-${prefixFor(categoryName)}`;

        // every SKU already using this prefix
        const existing = await catalogClient().fetch<string[]>(
            `*[_type == "product" && defined(sku) && sku match $pattern].sku`,
            { pattern: `${prefix}-*` }
        );

        const highest = (existing ?? []).reduce((max, sku) => {
            const match = /-(\d+)$/.exec(sku ?? "");
            const n = match ? Number.parseInt(match[1], 10) : 0;
            return Number.isFinite(n) && n > max ? n : max;
        }, 0);

        // Walk forward until the candidate is genuinely unused. `match` is a
        // pattern search, so this also covers SKUs typed by hand.
        let next = highest + 1;
        let sku = `${prefix}-${String(next).padStart(4, "0")}`;
        for (let guard = 0; guard < 50; guard++) {
            const clash = await catalogClient().fetch<string | null>(
                `*[_type == "product" && sku == $sku][0]._id`,
                { sku }
            );
            if (!clash) break;
            next += 1;
            sku = `${prefix}-${String(next).padStart(4, "0")}`;
        }

        return NextResponse.json({ sku });
    } catch (error) {
        console.error("GENERATE_SKU_ERROR", error);
        return NextResponse.json({ message: "Could not generate an SKU" }, { status: 500 });
    }
}
