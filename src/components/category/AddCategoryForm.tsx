"use client";

import Image from "next/image";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { shrinkImage } from "@/lib/shrinkImage";

/**
 * The template version posted raw FormData with a `categoryName` field and
 * never uploaded the image anywhere — the preview was a local object URL that
 * died with the page. This uploads to Sanity first, then posts JSON matching
 * the API contract.
 *
 * With `?id=` in the URL it edits that category instead of creating one.
 */

const GROUPS = [
    { value: "women", label: "Women" },
    { value: "men", label: "Men" },
    { value: "unisex", label: "Unisex" },
];

export default function AddCategoryForm() {
    const router = useRouter();
    const categoryId = useSearchParams().get("id");
    const isEdit = Boolean(categoryId);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [group, setGroup] = useState("women");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState<{ assetId: string; url: string } | null>(null);

    // in edit mode, load the category before anything can be saved
    useEffect(() => {
        if (!categoryId) return;
        let cancelled = false;
        fetch("/api/categories")
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Could not load categories"))))
            .then((d) => {
                if (cancelled) return;
                type Row = { _id: string; name?: string; group?: string; description?: string; image?: string };
                const found = (d.categories ?? []).find((c: Row) => c._id === categoryId);
                if (!found) throw new Error("Category not found");
                setName(found.name ?? "");
                setGroup(found.group ?? "women");
                setDescription(found.description ?? "");
                if (found.image) setImage({ assetId: "", url: found.image });
            })
            .catch((err) => !cancelled && setError(err.message))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [categoryId]);

    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        try {
            const body = new FormData();
            body.append("file", await shrinkImage(file));
            const res = await fetch("/api/upload", { method: "POST", body });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || `Upload failed (${res.status})`);
            setImage(data.assets[0]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        if (!name.trim()) return setError("Category name is required");

        setSaving(true);
        try {
            const res = await fetch("/api/categories", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: categoryId ?? undefined,
                    name: name.trim(),
                    group,
                    description: description.trim(),
                    // an empty assetId means "keep the current image"
                    imageAssetId: image?.assetId || null,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || `Could not save the category (${res.status})`);

            router.push("/all-category");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="wg-box">
                <div className="body-text" style={{ padding: "40px 0", textAlign: "center" }}>Loading category…</div>
            </div>
        );
    }

    return (
        <form className="form-add-category" onSubmit={handleSubmit}>
            {error && (
                <div className="wg-box mb-20">
                    <div className="body-text" style={{ color: "#e53e3e" }}>{error}</div>
                </div>
            )}

            <div className="wg-box mb-30">
                <fieldset className="name mw-585">
                    <div className="body-title mb-10">
                        Category name <span className="tf-color-1">*</span>
                    </div>
                    <input
                        className="mb-10"
                        type="text"
                        placeholder="e.g. Bras"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <div className="text-tiny">
                        This exact name is what the storefront filters on
                        (/shop?category=…), so keep it customer-facing.
                    </div>
                </fieldset>

                <fieldset className="mw-585 mt-20">
                    <div className="body-title mb-10">Audience</div>
                    <select value={group} onChange={(e) => setGroup(e.target.value)}>
                        {GROUPS.map((g) => (
                            <option key={g.value} value={g.value}>
                                {g.label}
                            </option>
                        ))}
                    </select>
                </fieldset>

                <fieldset className="mw-585 mt-20">
                    <div className="body-title mb-10">Description</div>
                    <textarea
                        rows={4}
                        placeholder="Optional short description for the category page"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </fieldset>

                <fieldset className="mt-20">
                    <div className="body-title mb-10">Category image</div>
                    <div className="upload-image mb-16">
                        <div className="up-load">
                            <label className="uploadfile" htmlFor="categoryImage">
                                <span className="icon">
                                    <i className="icon-upload-cloud"></i>
                                </span>
                                <span className="text-tiny">
                                    {uploading ? (
                                        "Uploading…"
                                    ) : (
                                        <>
                                            Drop your image here or{" "}
                                            <span className="text-secondary">click to browse</span>
                                        </>
                                    )}
                                </span>
                                <input
                                    type="file"
                                    id="categoryImage"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        {image && (
                            <div className="item">
                                <Image
                                    width={237}
                                    height={207}
                                    src={image.url}
                                    alt={name || "Category image"}
                                    style={{ objectFit: "cover" }}
                                    unoptimized
                                />
                            </div>
                        )}
                    </div>
                </fieldset>
            </div>

            <div className="cols gap10">
                <button className="tf-button w-full" type="submit" disabled={saving || uploading}>
                    {saving ? "Saving…" : isEdit ? "Save changes" : "Add category"}
                </button>
            </div>
        </form>
    );
}
