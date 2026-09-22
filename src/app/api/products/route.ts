import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/session";
import {
    listProducts, getProduct, createProduct, updateProduct, deleteProduct,
    type ProductInput,
} from "@/lib/sanity/catalog";

async function guard() {
    const session = await requireSession();
    if (!can(session, "products")) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return null;
}

/** Maps the form body to a ProductInput, tolerating string numbers from <input>. */
function parseBody(body: Record<string, unknown>): ProductInput | { error: string } {
    const title = String(body.title || "").trim();
    const price = Number.parseFloat(String(body.price));

    if (!title) return { error: "Title is required" };
    if (!Number.isFinite(price) || price < 0) return { error: "A valid price is required" };

    const salePriceRaw = body.salePrice;
    const salePrice =
        salePriceRaw === "" || salePriceRaw == null ? null : Number.parseFloat(String(salePriceRaw));
    if (salePrice != null && (!Number.isFinite(salePrice) || salePrice < 0)) {
        return { error: "Sale price must be a number" };
    }
    if (salePrice != null && salePrice >= price) {
        return { error: "Sale price must be lower than the regular price" };
    }

    const stockRaw = body.stock;
    const stock = stockRaw === "" || stockRaw == null ? 0 : Number.parseInt(String(stockRaw), 10);

    const asStringArray = (value: unknown): string[] =>
        Array.isArray(value) ? value.map(String).filter(Boolean) : [];

    return {
        title,
        slug: body.slug ? String(body.slug) : undefined,
        categoryId: body.categoryId ? String(body.categoryId) : null,
        price,
        salePrice,
        sku: body.sku ? String(body.sku) : null,
        brand: body.brand ? String(body.brand) : null,
        stock: Number.isFinite(stock) ? stock : 0,
        description: body.description ? String(body.description) : "",
        // no default score: stars nobody gave are invented social proof
        rating: body.rating != null && body.rating !== "" ? Number(body.rating) : null,
        featured: Boolean(body.featured),
        // free-form from the dashboard: any #RRGGBB colour, any size label
        colors: Array.isArray(body.colors)
            ? (body.colors as { name?: string; hex?: string }[])
                  .filter((c) => c && typeof c.hex === "string" && /^#[0-9a-f]{6}$/i.test(c.hex))
                  .map((c) => {
                      const hex = String(c.hex).toUpperCase();
                      return { name: String(c.name ?? "").trim().slice(0, 40) || hex, hex };
                  })
                  .filter((c, i, all) => all.findIndex((o) => o.hex === c.hex) === i)
            : [],
        sizes: [...new Set(asStringArray(body.sizes).map((s) => s.trim().slice(0, 20)).filter(Boolean))],
        tags: asStringArray(body.tags),
        imageAssetIds: asStringArray(body.imageAssetIds),
    };
}

export async function GET(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const id = new URL(req.url).searchParams.get("id");
        if (id) {
            const product = await getProduct(id);
            if (!product) return NextResponse.json({ message: "Product not found" }, { status: 404 });
            return NextResponse.json({ product });
        }
        return NextResponse.json({ products: await listProducts() });
    } catch (error) {
        console.error("LIST_PRODUCTS_ERROR", error);
        return NextResponse.json({ message: "Could not load products" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const parsed = parseBody(await req.json());
        if ("error" in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });

        const product = await createProduct(parsed);
        return NextResponse.json({ message: "Product created", product }, { status: 201 });
    } catch (error) {
        console.error("CREATE_PRODUCT_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const body = await req.json();
        const id = String(body.id || "").trim();
        if (!id) return NextResponse.json({ message: "Product id is required" }, { status: 400 });

        const parsed = parseBody(body);
        if ("error" in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });

        await updateProduct(id, parsed);
        return NextResponse.json({ message: "Product updated" });
    } catch (error) {
        console.error("UPDATE_PRODUCT_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const id = new URL(req.url).searchParams.get("id");
        if (!id) return NextResponse.json({ message: "Product id is required" }, { status: 400 });
        await deleteProduct(id);
        return NextResponse.json({ message: "Product deleted" });
    } catch (error) {
        console.error("DELETE_PRODUCT_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}
