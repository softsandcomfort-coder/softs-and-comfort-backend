"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { shrinkImage } from "@/lib/shrinkImage";
import { ColorField, SizeField, type ColorValue } from "./VariantFields";

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

type Category = { _id: string; name: string };
type ImageAsset = { assetId: string; url: string };
/** A file chosen but not yet uploaded — previewed from a local object URL. */
type PendingImage = { id: string; file: File; url: string };

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
    const [brand, setBrand] = useState("Soft & Comfort");
    const [stock, setStock] = useState("0");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState("");
    const [featured, setFeatured] = useState(false);
    const [sizes, setSizes] = useState<string[]>([]);
    const [colors, setColors] = useState<ColorValue[]>([]);
    const [images, setImages] = useState<ImageAsset[]>([]);
    const [pending, setPending] = useState<PendingImage[]>([]);

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
                setBrand(p.brand ?? "Soft & Comfort");
                setStock(p.stock != null ? String(p.stock) : "0");
                setDescription(p.description ?? "");
                setTags((p.tags ?? []).join(", "));
                setFeatured(Boolean(p.featured));
                setSizes(p.sizes ?? []);
                setColors((p.colors ?? []).map((c: ColorValue) => ({ ...c, hex: String(c.hex).toUpperCase() })));
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

    /**
     * Selecting files only previews them. Nothing reaches Sanity until Upload is
     * pressed, so discarding a wrong photo costs nothing and does not leave an
     * orphaned asset behind.
     */
    const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setError(null);
        setPending((prev) => [
            ...prev,
            ...files.map((file) => ({
                id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
                file,
                url: URL.createObjectURL(file),
            })),
        ]);
        e.target.value = "";   // allow re-selecting the same file
    }, []);

    const removePending = (id: string) =>
        setPending((prev) => {
            const match = prev.find((p) => p.id === id);
            if (match) URL.revokeObjectURL(match.url);   // don't leak the blob
            return prev.filter((p) => p.id !== id);
        });

    async function uploadPending() {
        if (pending.length === 0) return;
        setUploading(true);
        setError(null);
        try {
            // One photo per request, shrunk first: Vercel refuses request
            // bodies over 4.5 MB, which a batch of phone photos easily exceeds.
            for (const p of pending) {
                const body = new FormData();
                body.append("file", await shrinkImage(p.file));

                const res = await fetch("/api/upload", { method: "POST", body });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(
                        data.message ||
                            (res.status === 413 ? `${p.file.name} is too large` : `Upload failed (${res.status})`)
                    );
                }

                setImages((prev) => [...prev, ...(data.assets as ImageAsset[])]);
                URL.revokeObjectURL(p.url);
                setPending((prev) => prev.filter((q) => q !== p));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    }

    const removeImage = (assetId: string) =>
        setImages((prev) => prev.filter((i) => i.assetId !== assetId));

    async function generateSku() {
        setError(null);
        try {
            const params = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
            const res = await fetch(`/api/products/sku${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not generate an SKU");
            setSku(data.sku);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not generate an SKU");
        }
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setNotice(null);

        if (!title.trim()) return setError("Product title is required");
        if (!price.trim() || Number.isNaN(Number(price))) return setError("A valid price is required");
        if (!categoryId) return setError("Choose a category");
        if (pending.length > 0) {
            return setError("Upload the selected images first, or remove them");
        }
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
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || `Could not save the product (${res.status})`);

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
                                    Drop your images here or{" "}
                                    <span className="text-secondary">click to browse</span>
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

                        {pending.length > 0 && (
                            <div className="w-full mb-16">
                                <div className="flex items-center justify-between gap10 flex-wrap mb-10">
                                    <div className="body-title-2">
                                        {pending.length} image{pending.length > 1 ? "s" : ""} ready to upload
                                    </div>
                                    <div className="flex gap10">
                                        <button
                                            type="button"
                                            className="tf-button"
                                            onClick={uploadPending}
                                            disabled={uploading}
                                        >
                                            {uploading ? "Uploading…" : `Upload ${pending.length}`}
                                        </button>
                                        <button
                                            type="button"
                                            className="tf-button style-3"
                                            onClick={() => pending.forEach((img) => removePending(img.id))}
                                            disabled={uploading}
                                        >
                                            Discard
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap20 flex-wrap">
                                    {pending.map((img) => (
                                        <div
                                            className="item"
                                            key={img.id}
                                            style={{ position: "relative", opacity: uploading ? 0.6 : 1 }}
                                        >
                                            {/* a local blob URL, which next/image cannot optimise */}
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={img.url}
                                                alt={img.file.name}
                                                width={237}
                                                height={207}
                                                style={{ objectFit: "cover", borderRadius: 8 }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removePending(img.id)}
                                                aria-label={`Remove ${img.file.name}`}
                                                disabled={uploading}
                                                style={{
                                                    position: "absolute", top: 6, right: 6,
                                                    background: "rgba(0,0,0,.6)", color: "#fff",
                                                    border: 0, borderRadius: 4, cursor: "pointer",
                                                    width: 24, height: 24, lineHeight: "24px",
                                                }}
                                            >
                                                ×
                                            </button>
                                            <span
                                                style={{
                                                    position: "absolute", bottom: 6, left: 6,
                                                    background: "rgba(0,0,0,.6)", color: "#fff",
                                                    borderRadius: 4, fontSize: 11, padding: "2px 6px",
                                                }}
                                            >
                                                Not uploaded
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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
                            placeholder="Soft & Comfort"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                        />
                    </fieldset>

                    <fieldset>
                        <div className="body-title mb-10">SKU</div>
                        <div className="flex gap10">
                            <input
                                type="text"
                                placeholder="SC-BRA-0001"
                                value={sku}
                                onChange={(e) => setSku(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button type="button" className="tf-button style-3" onClick={generateSku}>
                                Generate
                            </button>
                        </div>
                        <div className="text-tiny mt-10">
                            Built from the category and checked against existing products so it is
                            unique. You can still type your own.
                        </div>
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
                <SizeField sizes={sizes} onChange={setSizes} />
                <ColorField colors={colors} onChange={setColors} />

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
