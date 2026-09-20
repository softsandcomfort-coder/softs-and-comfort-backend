"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/common/ConfirmModal";
import type { Review } from "@/lib/sanity/reviews";

/**
 * Enter the reviews customers have actually sent you.
 *
 * Nothing here is generated: the storefront section stays hidden until a real
 * review is published, because inventing them would be publishing fake
 * testimonials. Only the name, optional city and quote are stored — the
 * catalogue dataset is world-readable, so a customer's contact details must
 * never be typed in here.
 */

const blankForm = {
    id: "",
    customerName: "",
    city: "",
    rating: "5",
    quote: "",
    productId: "",
    published: true,
};

type FormState = typeof blankForm;
type ProductOption = { _id: string; title: string };

export default function ReviewManager({
    reviews,
    products,
}: {
    reviews: Review[];
    products: ProductOption[];
}) {
    const router = useRouter();
    const [form, setForm] = useState<FormState>(blankForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [selected, setSelected] = useState<Review | null>(null);
    const [deleting, setDeleting] = useState(false);

    const isEdit = Boolean(form.id);
    const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
        setForm((f) => ({ ...f, [k]: v }));

    function startEdit(review: Review) {
        setForm({
            id: review._id,
            customerName: review.customerName,
            city: review.city ?? "",
            rating: String(review.rating),
            quote: review.quote,
            productId: review.productId ?? "",
            published: review.published !== false,
        });
        setError(null);
        setNotice(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setNotice(null);
        setSaving(true);

        try {
            const res = await fetch("/api/reviews", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: form.id || undefined,
                    customerName: form.customerName,
                    city: form.city,
                    rating: Number(form.rating),
                    quote: form.quote,
                    productId: form.productId || null,
                    published: form.published,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not save the review");

            setNotice(isEdit ? "Review updated." : "Review added.");
            setForm(blankForm);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!selected) return;
        setDeleting(true);
        try {
            const res = await fetch("/api/reviews", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: selected._id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not delete the review");
            setSelected(null);
            setNotice("Review deleted.");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <>
            <form className="wg-box mb-30" onSubmit={handleSubmit}>
                <h5 className="mb-20">{isEdit ? "Edit review" : "Add a review"}</h5>

                {error && (
                    <div className="body-text mb-20" style={{ color: "#e53e3e" }}>{error}</div>
                )}
                {notice && (
                    <div className="body-text mb-20" style={{ color: "#0f993e" }}>{notice}</div>
                )}

                <div className="cols-lg gap22 mb-20">
                    <fieldset>
                        <div className="body-title mb-10">
                            Customer name <span className="tf-color-1">*</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Ayesha K."
                            value={form.customerName}
                            onChange={(e) => set("customerName", e.target.value)}
                            required
                        />
                        <div className="text-tiny mt-10">
                            Shown publicly. A first name and initial is enough — never a phone
                            number, email or address.
                        </div>
                    </fieldset>

                    <fieldset>
                        <div className="body-title mb-10">City</div>
                        <input
                            type="text"
                            placeholder="Lahore"
                            value={form.city}
                            onChange={(e) => set("city", e.target.value)}
                        />
                    </fieldset>
                </div>

                <div className="cols-lg gap22 mb-20">
                    <fieldset>
                        <div className="body-title mb-10">Rating</div>
                        <select value={form.rating} onChange={(e) => set("rating", e.target.value)}>
                            {[5, 4, 3, 2, 1].map((n) => (
                                <option key={n} value={n}>{n} out of 5</option>
                            ))}
                        </select>
                    </fieldset>

                    <fieldset>
                        <div className="body-title mb-10">Product</div>
                        <select
                            value={form.productId}
                            onChange={(e) => set("productId", e.target.value)}
                        >
                            <option value="">Not about a specific product</option>
                            {products.map((p) => (
                                <option key={p._id} value={p._id}>{p.title}</option>
                            ))}
                        </select>
                    </fieldset>
                </div>

                <fieldset className="mb-20">
                    <div className="body-title mb-10">
                        What they said <span className="tf-color-1">*</span>
                    </div>
                    <textarea
                        rows={4}
                        placeholder="Paste the customer's own words, exactly as they sent them."
                        value={form.quote}
                        onChange={(e) => set("quote", e.target.value)}
                        required
                    />
                    <div className="text-tiny mt-10">
                        Use what the customer actually wrote. Made-up reviews are illegal to
                        publish in most markets and are exactly what shoppers learn to spot.
                    </div>
                </fieldset>

                <label className="flex items-center gap10 mb-20" style={{ cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={form.published}
                        onChange={(e) => set("published", e.target.checked)}
                    />
                    <span className="body-title">Show on the storefront</span>
                </label>

                <div className="cols gap10">
                    <button className="tf-button w380" type="submit" disabled={saving}>
                        {saving ? "Saving…" : isEdit ? "Save changes" : "Add review"}
                    </button>
                    {isEdit && (
                        <button
                            type="button"
                            className="tf-button style-3"
                            onClick={() => {
                                setForm(blankForm);
                                setError(null);
                                setNotice(null);
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="wg-box">
                <h5 className="mb-20">All reviews</h5>

                {reviews.length === 0 ? (
                    <div
                        className="body-text"
                        style={{ padding: "32px 0", textAlign: "center", opacity: 0.7 }}
                    >
                        No reviews yet. The storefront section stays hidden until you publish one.
                    </div>
                ) : (
                    <>
                        <ul className="table-title flex gap20 mb-14">
                            <li><div className="body-title">Customer</div></li>
                            <li><div className="body-title">Rating</div></li>
                            <li><div className="body-title">Review</div></li>
                            <li><div className="body-title">Product</div></li>
                            <li><div className="body-title">Status</div></li>
                            <li><div className="body-title">Action</div></li>
                        </ul>
                        <ul className="flex flex-column">
                            {reviews.map((r) => (
                                <li key={r._id} className="wg-product item-row gap20">
                                    <div className="body-title-2">
                                        {r.customerName}
                                        {r.city ? <div className="text-tiny">{r.city}</div> : null}
                                    </div>
                                    <div className="body-text">{"★".repeat(r.rating)}</div>
                                    <div className="body-text">
                                        {r.quote.length > 90 ? `${r.quote.slice(0, 90)}…` : r.quote}
                                    </div>
                                    <div className="body-text">{r.productTitle ?? "—"}</div>
                                    <div
                                        className="body-title-2"
                                        style={{ color: r.published ? "#0f993e" : "#94A3B8" }}
                                    >
                                        {r.published ? "Published" : "Hidden"}
                                    </div>
                                    <div className="list-icon-function">
                                        <button
                                            type="button"
                                            className="item edit"
                                            onClick={() => startEdit(r)}
                                            style={{ background: "none", border: 0, cursor: "pointer" }}
                                        >
                                            <i className="icon-edit-3" />
                                        </button>
                                        <button
                                            type="button"
                                            className="item trash"
                                            onClick={() => setSelected(r)}
                                            style={{ background: "none", border: 0, cursor: "pointer" }}
                                        >
                                            <i className="icon-trash-2" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>

            <ConfirmModal
                open={!!selected}
                title="Confirm delete"
                message={
                    selected ? (
                        <>
                            Delete the review from <strong>{selected.customerName}</strong>?
                        </>
                    ) : null
                }
                confirmText={deleting ? "Deleting…" : "Delete"}
                busy={deleting}
                onConfirm={handleDelete}
                onCancel={() => setSelected(null)}
            />
        </>
    );
}
