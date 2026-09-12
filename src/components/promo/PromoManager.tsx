"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/common/ConfirmModal";
import type { PromoCode } from "@/lib/sanity/promo";

/**
 * Create, edit and retire discount codes.
 *
 * The value shown here is only what the code is *worth*; what a customer
 * actually gets is recomputed at checkout from this record, so editing a code
 * changes future orders without touching ones already placed.
 */

const money = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

const blankForm = {
    id: "",
    code: "",
    discountType: "percent" as "percent" | "fixed",
    value: "",
    minOrderValue: "",
    usageLimit: "",
    expiresAt: "",
    active: true,
};

type FormState = typeof blankForm;

export default function PromoManager({ promoCodes }: { promoCodes: PromoCode[] }) {
    const router = useRouter();
    const [form, setForm] = useState<FormState>(blankForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [selected, setSelected] = useState<PromoCode | null>(null);
    const [deleting, setDeleting] = useState(false);

    const isEdit = Boolean(form.id);
    const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
        setForm((f) => ({ ...f, [k]: v }));

    function startEdit(promo: PromoCode) {
        setForm({
            id: promo._id,
            code: promo.code,
            discountType: promo.discountType,
            value: String(promo.value),
            minOrderValue: promo.minOrderValue != null ? String(promo.minOrderValue) : "",
            usageLimit: promo.usageLimit != null ? String(promo.usageLimit) : "",
            // datetime-local wants YYYY-MM-DDTHH:mm
            expiresAt: promo.expiresAt ? promo.expiresAt.slice(0, 16) : "",
            active: promo.active !== false,
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
            const res = await fetch("/api/promo-codes", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...(isEdit ? { id: form.id } : {}),
                    code: form.code,
                    discountType: form.discountType,
                    value: form.value,
                    minOrderValue: form.minOrderValue,
                    usageLimit: form.usageLimit,
                    expiresAt: form.expiresAt,
                    active: form.active,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not save the code");

            setNotice(isEdit ? "Promo code updated." : "Promo code created.");
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
        setError(null);
        try {
            const res = await fetch(`/api/promo-codes?id=${encodeURIComponent(selected._id)}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Could not delete the code");
            }
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setDeleting(false);
            setSelected(null);
        }
    }

    const describe = (p: PromoCode) =>
        p.discountType === "percent" ? `${p.value}% off` : `${money(p.value)} off`;

    const statusOf = (p: PromoCode): { label: string; color: string } => {
        if (p.active === false) return { label: "Inactive", color: "#94A3B8" };
        if (p.expiresAt && new Date(p.expiresAt).getTime() < Date.now())
            return { label: "Expired", color: "#EF4444" };
        if (p.usageLimit != null && (p.usedCount ?? 0) >= p.usageLimit)
            return { label: "Limit reached", color: "#EF4444" };
        return { label: "Active", color: "#22C55E" };
    };

    return (
        <>
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

            <form className="wg-box mb-30" onSubmit={handleSubmit}>
                <h5 className="mb-20">{isEdit ? `Edit ${form.code}` : "New promo code"}</h5>

                <div className="cols-lg gap22">
                    <fieldset>
                        <div className="body-title mb-10">
                            Code <span className="tf-color-1">*</span>
                        </div>
                        <input
                            type="text"
                            placeholder="WELCOME10"
                            value={form.code}
                            onChange={(e) => set("code", e.target.value.toUpperCase())}
                            required
                        />
                        <div className="text-tiny mt-10">Letters, numbers and hyphens.</div>
                    </fieldset>

                    <fieldset>
                        <div className="body-title mb-10">Discount type</div>
                        <select
                            value={form.discountType}
                            onChange={(e) => set("discountType", e.target.value as "percent" | "fixed")}
                        >
                            <option value="percent">Percentage off</option>
                            <option value="fixed">Fixed amount off</option>
                        </select>
                    </fieldset>

                    <fieldset>
                        <div className="body-title mb-10">
                            {form.discountType === "percent" ? "Percent (1-100)" : "Amount (Rs)"}{" "}
                            <span className="tf-color-1">*</span>
                        </div>
                        <input
                            type="number"
                            min="1"
                            max={form.discountType === "percent" ? 100 : undefined}
                            value={form.value}
                            onChange={(e) => set("value", e.target.value)}
                            required
                        />
                    </fieldset>
                </div>

                <div className="cols-lg gap22 mt-20">
                    <fieldset>
                        <div className="body-title mb-10">Minimum order (Rs)</div>
                        <input
                            type="number"
                            min="0"
                            placeholder="No minimum"
                            value={form.minOrderValue}
                            onChange={(e) => set("minOrderValue", e.target.value)}
                        />
                    </fieldset>

                    <fieldset>
                        <div className="body-title mb-10">Usage limit</div>
                        <input
                            type="number"
                            min="1"
                            placeholder="Unlimited"
                            value={form.usageLimit}
                            onChange={(e) => set("usageLimit", e.target.value)}
                        />
                    </fieldset>

                    <fieldset>
                        <div className="body-title mb-10">Expires</div>
                        <input
                            type="datetime-local"
                            value={form.expiresAt}
                            onChange={(e) => set("expiresAt", e.target.value)}
                        />
                        <div className="text-tiny mt-10">Leave blank for no expiry.</div>
                    </fieldset>
                </div>

                <label className="flex items-center gap10 mt-20" style={{ cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(e) => set("active", e.target.checked)}
                    />
                    <span className="body-title-2">Active</span>
                </label>

                <div className="cols gap10 mt-20">
                    <button className="tf-button w380" type="submit" disabled={saving}>
                        {saving ? "Saving…" : isEdit ? "Update code" : "Create code"}
                    </button>
                    {isEdit && (
                        <button
                            type="button"
                            className="tf-button style-3 w380"
                            onClick={() => {
                                setForm(blankForm);
                                setError(null);
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="wg-box">
                <h5 className="mb-20">All codes</h5>

                {promoCodes.length === 0 ? (
                    <div
                        className="body-text"
                        style={{ padding: "32px 0", textAlign: "center", opacity: 0.7 }}
                    >
                        No promo codes yet. Create one above and it works at checkout immediately.
                    </div>
                ) : (
                    <>
                        <ul className="table-title flex gap20 mb-14">
                            <li><div className="body-title">Code</div></li>
                            <li><div className="body-title">Discount</div></li>
                            <li><div className="body-title">Conditions</div></li>
                            <li><div className="body-title">Used</div></li>
                            <li><div className="body-title">Status</div></li>
                            <li><div className="body-title">Action</div></li>
                        </ul>
                        <ul className="flex flex-column">
                            {promoCodes.map((p) => {
                                const status = statusOf(p);
                                return (
                                    <li key={p._id} className="wg-product item-row gap20">
                                        <div className="body-title-2">{p.code}</div>
                                        <div className="body-text">{describe(p)}</div>
                                        <div className="body-text">
                                            {[
                                                p.minOrderValue != null
                                                    ? `Min ${money(p.minOrderValue)}`
                                                    : null,
                                                p.expiresAt
                                                    ? `Until ${new Date(p.expiresAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
                                                    : null,
                                            ]
                                                .filter(Boolean)
                                                .join(" · ") || "None"}
                                        </div>
                                        <div className="body-text">
                                            {p.usedCount ?? 0}
                                            {p.usageLimit != null ? ` / ${p.usageLimit}` : ""}
                                        </div>
                                        <div className="body-title-2" style={{ color: status.color }}>
                                            {status.label}
                                        </div>
                                        <div className="list-icon-function">
                                            <button
                                                type="button"
                                                className="item edit"
                                                onClick={() => startEdit(p)}
                                                style={{ background: "none", border: 0, cursor: "pointer" }}
                                            >
                                                <i className="icon-edit-3" />
                                            </button>
                                            <button
                                                type="button"
                                                className="item trash"
                                                onClick={() => setSelected(p)}
                                                style={{ background: "none", border: 0, cursor: "pointer" }}
                                            >
                                                <i className="icon-trash-2" />
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
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
                            Delete the code <strong>{selected.code}</strong>? Orders that already used
                            it keep their discount.
                        </>
                    ) : null
                }
                confirmText="Delete"
                busy={deleting}
                onConfirm={handleDelete}
                onCancel={() => setSelected(null)}
            />
        </>
    );
}
