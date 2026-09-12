"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * Create or edit an attribute.
 *
 * The template version could only create, its Cancel button was an `<a href="#">`
 * that did nothing, and nothing on screen explained that the single value field
 * is split on commas by the API. `PUT /api/attributes` existed with no UI
 * consumer at all; the edit icon in the list now routes here with ?id=.
 */
export default function AddAttributesForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const attributeId = searchParams.get("id") || "";
    const isEdit = Boolean(attributeId);

    const [name, setName] = useState("");
    const [values, setValues] = useState("");
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!attributeId) return;
        let cancelled = false;

        fetch("/api/attributes")
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Could not load attributes"))))
            .then((d) => {
                if (cancelled) return;
                const found = (d.attributes ?? []).find(
                    (a: { _id: string }) => a._id === attributeId
                );
                if (!found) throw new Error("Attribute not found");
                setName(found.name ?? "");
                setValues((found.values ?? []).join(", "));
            })
            .catch((err) => !cancelled && setError(err.message))
            .finally(() => !cancelled && setLoading(false));

        return () => {
            cancelled = true;
        };
    }, [attributeId]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (!name.trim()) return setError("Attribute name is required");
        if (!values.trim()) return setError("Add at least one value");

        setSaving(true);
        try {
            const res = await fetch("/api/attributes", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...(isEdit ? { id: attributeId } : {}),
                    name: name.trim(),
                    value: values,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not save the attribute");

            router.push("/all-attributes");
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
                <div className="body-text" style={{ padding: "40px 0", textAlign: "center" }}>
                    Loading attribute…
                </div>
            </div>
        );
    }

    return (
        <form className="form-add-attributes" onSubmit={handleSubmit}>
            {error && (
                <div className="wg-box mb-20">
                    <div className="body-text" style={{ color: "#e53e3e" }}>{error}</div>
                </div>
            )}

            <div className="wg-box mb-30">
                <fieldset className="name mb-20">
                    <div className="body-title mb-10">
                        Attribute name <span className="tf-color-1">*</span>
                    </div>
                    <input
                        type="text"
                        placeholder="e.g. Fabric"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </fieldset>

                <fieldset className="name">
                    <div className="body-title mb-10">
                        Values <span className="tf-color-1">*</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Cotton, Bamboo, Modal"
                        value={values}
                        onChange={(e) => setValues(e.target.value)}
                        required
                    />
                    <div className="text-tiny mt-10">
                        Separate values with commas. These feed the tag options you can apply to
                        products.
                    </div>
                </fieldset>
            </div>

            <div className="cols gap10">
                <button className="tf-button w380" type="submit" disabled={saving}>
                    {saving ? "Saving…" : isEdit ? "Update attribute" : "Add attribute"}
                </button>
                <Link href="/all-attributes" className="tf-button style-3 w380">
                    Cancel
                </Link>
            </div>
        </form>
    );
}
