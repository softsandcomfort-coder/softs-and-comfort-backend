import "server-only";
import { catalogClient } from "./client";

/**
 * Catalogue reads and writes for the dashboard.
 *
 * Previously the dashboard wrote to SQLite but rendered its lists from static
 * fixtures in src/data — so the database was effectively write-only and nothing
 * you saved ever showed up in a table. Every list page now reads through here.
 */

export type ProductColor = { name: string; hex: string };

export type ProductListItem = {
    _id: string;
    title: string;
    slug: string | null;
    price: number;
    salePrice: number | null;
    stock: number | null;
    sku: string | null;
    categoryName: string | null;
    categoryId: string | null;
    image: string | null;
    publishedAt: string | null;
};

export type ProductDetail = ProductListItem & {
    description: string | null;
    brand: string | null;
    rating: number | null;
    featured: boolean;
    colors: ProductColor[];
    sizes: string[];
    tags: string[];
    images: { assetId: string; url: string }[];
};

export type CategoryItem = {
    _id: string;
    name: string;
    slug: string | null;
    group: string | null;
    image: string | null;
    productCount: number;
};

export type AttributeItem = {
    _id: string;
    name: string;
    values: string[];
};

const PRODUCT_LIST_PROJECTION = `{
    _id,
    title,
    "slug": slug.current,
    price,
    salePrice,
    stock,
    sku,
    "categoryName": category->name,
    "categoryId": category->_id,
    "image": images[0].asset->url,
    publishedAt
}`;

const PRODUCT_DETAIL_PROJECTION = `{
    _id,
    title,
    "slug": slug.current,
    price,
    salePrice,
    stock,
    sku,
    brand,
    description,
    rating,
    featured,
    "categoryName": category->name,
    "categoryId": category->_id,
    "image": images[0].asset->url,
    "images": images[]{ "assetId": asset->_id, "url": asset->url },
    colors[]{ name, hex },
    sizes,
    tags,
    publishedAt
}`;

// ─── Products ────────────────────────────────────────────────────────────────

export async function listProducts(): Promise<ProductListItem[]> {
    return catalogClient().fetch(
        `*[_type == "product"] | order(publishedAt desc) ${PRODUCT_LIST_PROJECTION}`
    );
}

export async function getProduct(id: string): Promise<ProductDetail | null> {
    return catalogClient().fetch(
        `*[_type == "product" && _id == $id][0] ${PRODUCT_DETAIL_PROJECTION}`,
        { id }
    );
}

export type ProductInput = {
    title: string;
    slug?: string;
    categoryId?: string | null;
    price: number;
    salePrice?: number | null;
    sku?: string | null;
    brand?: string | null;
    stock?: number | null;
    description?: string | null;
    rating?: number | null;
    featured?: boolean;
    colors?: ProductColor[];
    sizes?: string[];
    tags?: string[];
    /** Sanity image asset ids, in display order. */
    imageAssetIds?: string[];
};

export function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 96);
}

/** Appends -2, -3, … when the slug is already taken by a different document. */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
    const client = catalogClient();
    let candidate = base || "product";
    let n = 1;
    for (;;) {
        const clash = await client.fetch<string | null>(
            `*[_type == "product" && slug.current == $slug && _id != $excludeId][0]._id`,
            { slug: candidate, excludeId: excludeId ?? "none" }
        );
        if (!clash) return candidate;
        n += 1;
        candidate = `${base}-${n}`;
    }
}

function buildProductDoc(input: ProductInput, slug: string) {
    return {
        _type: "product" as const,
        title: input.title,
        slug: { _type: "slug" as const, current: slug },
        ...(input.categoryId
            ? { category: { _type: "reference" as const, _ref: input.categoryId } }
            : {}),
        price: input.price,
        salePrice: input.salePrice ?? null,
        sku: input.sku ?? null,
        brand: input.brand ?? null,
        stock: input.stock ?? 0,
        description: input.description ?? "",
        rating: input.rating ?? null,
        featured: input.featured ?? false,
        colors: (input.colors ?? []).map((c, i) => ({
            _type: "productColor" as const,
            _key: `color-${i}-${c.hex.replace("#", "")}`,
            name: c.name,
            hex: c.hex,
        })),
        sizes: input.sizes ?? [],
        tags: input.tags ?? [],
        images: (input.imageAssetIds ?? []).map((assetId, i) => ({
            _type: "image" as const,
            _key: `image-${i}-${assetId.slice(-8)}`,
            asset: { _type: "reference" as const, _ref: assetId },
        })),
    };
}

export async function createProduct(input: ProductInput): Promise<{ _id: string }> {
    const slug = await uniqueSlug(input.slug ? slugify(input.slug) : slugify(input.title));
    const doc = await catalogClient().create({
        ...buildProductDoc(input, slug),
        publishedAt: new Date().toISOString(),
    });
    return { _id: doc._id };
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
    const slug = await uniqueSlug(input.slug ? slugify(input.slug) : slugify(input.title), id);
    const doc = buildProductDoc(input, slug);
    // `_type` is immutable on an existing document
    const { _type, ...fields } = doc;
    void _type;
    await catalogClient().patch(id).set(fields).commit();
}

export async function deleteProduct(id: string): Promise<void> {
    await catalogClient().delete(id);
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function listCategories(): Promise<CategoryItem[]> {
    return catalogClient().fetch(`
        *[_type == "category"] | order(displayOrder asc, name asc) {
            _id,
            name,
            "slug": slug.current,
            group,
            "image": image.asset->url,
            "productCount": count(*[_type == "product" && references(^._id)])
        }
    `);
}

export async function createCategory(input: {
    name: string;
    group?: string;
    description?: string | null;
    imageAssetId?: string | null;
}): Promise<{ _id: string }> {
    const doc = await catalogClient().create({
        _type: "category",
        name: input.name,
        slug: { _type: "slug", current: slugify(input.name) },
        group: input.group ?? "women",
        description: input.description ?? "",
        displayOrder: 100,
        ...(input.imageAssetId
            ? { image: { _type: "image", asset: { _type: "reference", _ref: input.imageAssetId } } }
            : {}),
    });
    return { _id: doc._id };
}

export async function updateCategory(
    id: string,
    input: { name?: string; group?: string; description?: string | null; imageAssetId?: string | null }
): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (input.name) {
        patch.name = input.name;
        patch.slug = { _type: "slug", current: slugify(input.name) };
    }
    if (input.group) patch.group = input.group;
    if (input.description !== undefined) patch.description = input.description ?? "";
    if (input.imageAssetId) {
        patch.image = { _type: "image", asset: { _type: "reference", _ref: input.imageAssetId } };
    }
    await catalogClient().patch(id).set(patch).commit();
}

/** Refuses to delete a category that products still reference. */
export async function deleteCategory(id: string): Promise<{ ok: boolean; productCount: number }> {
    const client = catalogClient();
    const productCount = await client.fetch<number>(
        `count(*[_type == "product" && category._ref == $id])`,
        { id }
    );
    if (productCount > 0) return { ok: false, productCount };
    await client.delete(id);
    return { ok: true, productCount: 0 };
}

// ─── Attributes ──────────────────────────────────────────────────────────────

export async function listAttributes(): Promise<AttributeItem[]> {
    return catalogClient().fetch(`*[_type == "attribute"] | order(name asc) { _id, name, values }`);
}

export async function createAttribute(name: string, values: string[]): Promise<{ _id: string }> {
    const doc = await catalogClient().create({ _type: "attribute", name, values });
    return { _id: doc._id };
}

export async function updateAttribute(id: string, name: string, values: string[]): Promise<void> {
    await catalogClient().patch(id).set({ name, values }).commit();
}

export async function deleteAttribute(id: string): Promise<void> {
    await catalogClient().delete(id);
}

// ─── Store settings (singleton) ──────────────────────────────────────────────

export async function getStoreSettings(): Promise<Record<string, unknown>> {
    const doc = await catalogClient().fetch(`*[_type == "siteSettings"][0]`);
    return doc ?? {};
}

export async function saveStoreSettings(data: Record<string, unknown>): Promise<void> {
    await catalogClient()
        .createOrReplace({ _id: "siteSettings", _type: "siteSettings", ...data })
        .catch((err) => {
            throw err;
        });
}

// ─── Image upload ────────────────────────────────────────────────────────────

export async function uploadImage(file: File): Promise<{ assetId: string; url: string }> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await catalogClient().assets.upload("image", buffer, {
        filename: file.name,
        contentType: file.type,
    });
    return { assetId: asset._id, url: asset.url };
}
