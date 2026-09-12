"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * The single product form, used for both creating and editing.
 *
 * The template shipped two near-identical 500-line forms whose category,
 * colour and size options were hardcoded ("Women", "Dress", "Orange", "M"), and
 * whose edit form never loaded the product it was editing — saving overwrote
 * every field with those defaults. This replaces both: categories come from
 * Sanity, and in edit mode the existing product is fetched and pre-filled
 * before anything can be saved.
 */

const SIZE_OPTIONS = [
    "XS", "S", "M", "L", "XL", "XXL",
    "4", "6", "8", "10", "12", "14", "16", "18", "20",
];

/** Matches the swatch values the storefront's colour filter offers. */
const COLOR_PRESETS = [
    { name: "Black", hex: "#000000" },
    { name: "Sky", hex: "#9BD1FF" },
    { name: "Teal", hex: "#21B290" },
    { name: "Blush", hex: "#FEC4C4" },
    { name: "Coral", hex: "#FF7354" },
    { name: "Mint", hex: "#51EDC8" },
    { name: "Lilac", hex: "#B77CF3" },
    { name: "Rose", hex: "#FF4A76" },
    { name: "Blue", hex: "#3E68FF" },
    { name: "Green", hex: "#7BEF68" },
];

type Category = { _id: string; name: string };
type ImageAsset = { assetId: string; url: string };
type ColorValue = { name: string; hex: string };

type ProductFormProps = {
    /** Sanity document id — when present the form loads and updates that product. */
    productId?: string;
};

export default function ProductForm({ productId }: ProductFormProps) {
    const router = useRouter();
    const isEdit = Boolean(productId);

    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingProduct, setLoadingProduct] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    // form state
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [price, setPrice] = useState("");
    const [salePrice, setSalePrice] = useState("");
    const [sku, setSku] = useState("");
    const [brand, setBrand] = useState("Velorra");
    const [stock, setStock] = useState("0");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState("");
    const [featured, setFeatured] = useState(false);
    const [sizes, setSizes] = useState<string[]>([]);
    const [colors, setColors] = useState<ColorValue[]>([]);
    const [images, setImages] = useState<ImageAsset[]>([]);

    // categories for the picker
    useEffect(() => {
        let cancelled = false;
        fetch("/api/categories")
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Could not load categories"))))
            .then((d) => {
                if (!cancelled) setCategories(d.categories ?? []);
            })
            .catch((err) => !cancelled && setError(err.message));
        return () => {
            cancelled = true;
        };
    }, []);

    // in edit mode, load the product BEFORE the form can be submitted
    useEffect(() => {
        if (!productId) return;
        let cancelled = false;

        fetch(`/api/products?id=${encodeURIComponent(productId)}`)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Could not load this product"))))
            .then((d) => {
                if (cancelled) return;
                const p = d.product;
                if (!p) throw new Error("Product not found");
                setTitle(p.title ?? "");
                setCategoryId(p.categoryId ?? "");
                setPrice(p.price != null ? String(p.price) : "");
                setSalePrice(p.salePrice != null ? String(p.salePrice) : "");
                setSku(p.sku ?? "");
                setBrand(p.brand ?? "Velorra");
                setStock(p.stock != null ? String(p.stock) : "0");
                setDescription(p.description ?? "");
                setTags((p.tags ?? []).join(", "));
                setFeatured(Boolean(p.featured));
                setSizes(p.sizes ?? []);
                setColors(p.colors ?? []);
                setImages(
                    (p.images ?? []).filter((i: ImageAsset) => i?.assetId && i?.url)
                );
            })
            .catch((err) => !cancelled && setError(err.message))
            .finally(() => !cancelled && setLoadingProduct(false));

        return () => {
            cancelled = true;
        };
    }, [productId]);

    const handleFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setUploading(true);
        setError(null);
        try {
            const body = new FormData();
            files.forEach((f) => body.append("file", f));

            const res = await fetch("/api/upload", { method: "POST", body });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Upload failed");

            setImages((prev) => [...prev, ...(data.assets as ImageAsset[])]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
            e.target.value = "";   // allow re-selecting the same file
        }
    }, []);

    const removeImage = (assetId: string) =>
        setImages((prev) => prev.filter((i) => i.assetId !== assetId));

    const toggleSize = (size: string) =>
        setSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));

    const toggleColor = (color: ColorValue) =>
        setColors((prev) =>
            prev.some((c) => c.hex === color.hex)
                ? prev.filter((c) => c.hex !== color.hex)
                : [...prev, color]
        );

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setNotice(null);

        if (!title.trim()) return setError("Product title is required");
        if (!price.trim() || Number.isNaN(Number(price))) return setError("A valid price is required");
        if (!categoryId) return setError("Choose a category");
        if (images.length === 0) return setError("Add at least one product image");
        if (salePrice && Number(salePrice) >= Number(price)) {
            return setError("Sale price must be lower than the regular price");
        }

        setSaving(true);
        const payload = {
            ...(productId ? { id: productId } : {}),
            title: title.trim(),
            categoryId,
            price: Number(price),
            salePrice: salePrice ? Number(salePrice) : null,
            sku: sku.trim() || null,
            brand: brand.trim() || null,
            stock: stock ? Number(stock) : 0,
            description: description.trim(),
            featured,
            sizes,
            colors,
            tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            imageAssetIds: images.map((i) => i.assetId),
        };

        try {
            const res = await fetch("/api/products", {
                method: productId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not save the product");

            setNotice(productId ? "Product updated" : "Product created");
            router.push("/all-product");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    if (loadingProduct) {
        return (
            <div className="wg-box">
                <div className="body-text" style={{ padding: "40px 0", textAlign: "center" }}>
                    Loading product…
                </div>
            </div>
        );
    }

    return (
        <form className="form-add-product" onSubmit={handleSubmit}>
            {error && (
                <div className="wg-box mb-20">
                    <div className="body-text" style={{ color: "#e53e3e" }}>{error}</div>
                </div>
            )}
            {notice && (
                <div className="wg-box mb-20">
                    <div className="body-text" style={{ color: "#0f993e" }}>{notice}</div>
                </div>
            )}

            <div className="wg-box mb-30">
                <fieldset>
                    <div className="body-title mb-10">
                        Product images <span className="tf-color-1">*</span>
                    </div>
                    <div className="upload-image mb-16">
                        <div className="up-load">
                            <label className="uploadfile" htmlFor="productImages">
                                <span className="icon">
                                    <i className="icon-upload-cloud"></i>
                                </span>
                                <span className="text-tiny">
                                    {uploading ? (
                                        "Uploading…"
                                    ) : (
                                        <>
                                            Drop your images here or{" "}
                                            <span className="text-secondary">click to browse</span>
                                        </>
                                    )}
                                </span>
                                <input
                                    type="file"
                                    id="productImages"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        <div className="flex gap20 flex-wrap">
                            {images.map((img, index) => (
                                <div className="item" key={img.assetId} style={{ position: "relative" }}>
                                    <Image
                                        width={237}
                                        height={207}
                                        src={img.url}
                                        alt={`Product image ${index + 1}`}
                                        style={{ objectFit: "cover" }}
                                        unoptimized
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(img.assetId)}
                                        aria-label="Remove image"
                                        style={{
                                            position: "absolute", top: 6, right: 6,
                                            background: "rgba(0,0,0,.6)", color: "#fff",
                                            border: 0, borderRadius: 4, cursor: "pointer",
                                            width: 24, height: 24, lineHeight: "24px",
                                        }}
                                    >
                                        ×
                                    </button>
                                    {index === 0 && (
                                        <span
                                            style={{
                                                position: "absolute", bottom: 6, left: 6,
                                                background: "rgba(0,0,0,.6)", color: "#fff",
                                                borderRadius: 4, fontSize: 11, padding: "2px 6px",
                                            }}
                                        >
                                            Main
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="body-text">
                        The first image is used as the product card thumbnail on the storefront.
                        Images are uploaded to Sanity and resized automatically — no need to
                        shrink them yourself.
                    </div>
                </fieldset>
            </div>

            <div className="wg-box mb-30">
                <fieldset className="name">
                    <div className="body-title mb-10">
                        Product title <span className="tf-color-1">*</span>
                    </div>
                    <input
                        className="mb-10"
                        type="text"
                        placeholder="e.g. Soft Touch Wireless Bra"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </fieldset>

                <fieldset className="category">
                    <div className="body-title mb-10">
                        Category <span className="tf-color-1">*</span>
                    </div>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                        <option value="">Select a category</option>
                        {categories.map((c) => (
                            <option key={c._id} value={c._id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    {categories.length === 0 && (
                        <div className="text-tiny mt-10">
                            No categories yet — create one under Categories first.
                        </div>
                    )}
                </fieldset>

                <div className="cols-lg gap22">
                    <fieldset className="price">
                        <div className="body-title mb-10">
                            Price (Rs) <span className="tf-color-1">*</span>
                        </div>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="1690"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                    </fieldset>

                    <fieldset className="sale-price">
                        <div className="body-title mb-10">Sale price (Rs)</div>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="Leave empty if not discounted"
                            value={salePrice}
                            onChange={(e) => setSalePrice(e.target.value)}
                        />
                    </fieldset>

                    <fieldset>
                        <div className="body-title mb-10">Stock</div>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                        />
                    </fieldset>
                </div>

                <div className="cols-lg gap22">
                    <fieldset className="choose-brand">
                        <div className="body-title mb-10">Brand</div>
                        <input
                            type="text"
                            placeholder="Velorra"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                        />
                    </fieldset>

                    <fieldset>
                        <div className="body-title mb-10">SKU</div>
                        <input
                            type="text"
                            placeholder="VF-BRA-001"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                        />
                    </fieldset>
                </div>

                <fieldset className="description">
                    <div className="body-title mb-10">Description</div>
                    <textarea
                        placeholder="Describe the fabric, fit and care instructions…"
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </fieldset>
            </div>

            <div className="wg-box mb-30">
                <fieldset>
                    <div className="body-title mb-10">Sizes</div>
                    <div className="flex gap10 flex-wrap">
                        {SIZE_OPTIONS.map((size) => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => toggleSize(size)}
                                className={sizes.includes(size) ? "tf-button" : "tf-button style-3"}
                                style={{ minWidth: 56 }}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                    <div className="text-tiny mt-10">
                        Only the sizes you select here appear in the storefront size filter.
                    </div>
                </fieldset>

                <fieldset className="mt-20">
                    <div className="body-title mb-10">Colours</div>
                    <div className="flex gap10 flex-wrap">
                        {COLOR_PRESETS.map((color) => {
                            const active = colors.some((c) => c.hex === color.hex);
                            return (
                                <button
                                    key={color.hex}
                                    type="button"
                                    onClick={() => toggleColor(color)}
                                    title={color.name}
                                    aria-label={color.name}
                                    aria-pressed={active}
                                    style={{
                                        width: 34, height: 34, borderRadius: "50%",
                                        background: color.hex, cursor: "pointer",
                                        border: active ? "3px solid #111" : "1px solid rgba(0,0,0,.2)",
                                    }}
                                />
                            );
                        })}
                    </div>
                    {colors.length > 0 && (
                        <div className="text-tiny mt-10">
                            Selected: {colors.map((c) => c.name).join(", ")}
                        </div>
                    )}
                </fieldset>

                <fieldset className="mt-20">
                    <div className="body-title mb-10">Tags</div>
                    <input
                        type="text"
                        placeholder="Cotton, Seamless, Everyday"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />
                    <div className="text-tiny mt-10">
                        Comma separated. These drive the tag filter in the storefront sidebar.
                    </div>
                </fieldset>

                <fieldset className="mt-20">
                    <label className="flex items-center gap10" style={{ cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={featured}
                            onChange={(e) => setFeatured(e.target.checked)}
                        />
                        <span className="body-title">Feature on the homepage</span>
                    </label>
                </fieldset>
            </div>

            <div className="cols gap10">
                <button className="tf-button w-full" type="submit" disabled={saving || uploading}>
                    {saving ? "Saving…" : isEdit ? "Update product" : "Add product"}
                </button>
            </div>
        </form>
    );
}
