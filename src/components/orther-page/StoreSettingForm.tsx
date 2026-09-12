"use client";

import { FormEvent, useEffect, useState } from "react";

/**
 * Store settings — the `siteSettings` singleton in the public catalogue dataset.
 *
 * The template version collected shopName / companyName / taxId / zipcode, none
 * of which matched the schema, so values were written into the document under
 * keys nothing ever read. These fields are the ones the storefront actually
 * consumes.
 */

type Settings = {
    storeName: string;
    tagline: string;
    supportEmail: string;
    phone: string;
    whatsappNumber: string;
    address: string;
    currency: string;
    currencySymbol: string;
    freeShippingThreshold: string;
    shippingFlatRate: string;
    social: { facebook: string; instagram: string; tiktok: string; youtube: string };
};

const DEFAULTS: Settings = {
    storeName: "Soft & Comfort",
    tagline: "",
    supportEmail: "",
    phone: "",
    whatsappNumber: "",
    address: "",
    currency: "PKR",
    currencySymbol: "Rs",
    freeShippingThreshold: "",
    shippingFlatRate: "0",
    social: { facebook: "", instagram: "", tiktok: "", youtube: "" },
};

export default function StoreSettingForm() {
    const [form, setForm] = useState<Settings>(DEFAULTS);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/settings/store")
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Could not load store settings"))))
            .then((d) => {
                if (cancelled) return;
                setForm({
                    storeName: d.storeName ?? DEFAULTS.storeName,
                    tagline: d.tagline ?? "",
                    supportEmail: d.supportEmail ?? "",
                    phone: d.phone ?? "",
                    whatsappNumber: d.whatsappNumber ?? "",
                    address: d.address ?? "",
                    currency: d.currency ?? DEFAULTS.currency,
                    currencySymbol: d.currencySymbol ?? DEFAULTS.currencySymbol,
                    freeShippingThreshold:
                        d.freeShippingThreshold != null ? String(d.freeShippingThreshold) : "",
                    shippingFlatRate: d.shippingFlatRate != null ? String(d.shippingFlatRate) : "0",
                    social: {
                        facebook: d.social?.facebook ?? "",
                        instagram: d.social?.instagram ?? "",
                        tiktok: d.social?.tiktok ?? "",
                        youtube: d.social?.youtube ?? "",
                    },
                });
            })
            .catch((err) => !cancelled && setError(err.message))
            .finally(() => !cancelled && setLoadingSettings(false));
        return () => {
            cancelled = true;
        };
    }, []);

    const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
        setForm((f) => ({ ...f, [key]: value }));

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setNotice(null);

        if (!form.storeName.trim()) return setError("Store name is required");

        setSaving(true);
        try {
            const res = await fetch("/api/settings/store", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeName: form.storeName.trim(),
                    tagline: form.tagline.trim(),
                    supportEmail: form.supportEmail.trim(),
                    phone: form.phone.trim(),
                    // digits only — the storefront builds wa.me links from this
                    whatsappNumber: form.whatsappNumber.replace(/[^0-9]/g, ""),
                    address: form.address.trim(),
                    currency: form.currency.trim(),
                    currencySymbol: form.currencySymbol.trim(),
                    // numeric fields are stored as numbers, or cleared when blank
                    freeShippingThreshold: form.freeShippingThreshold
                        ? Number(form.freeShippingThreshold)
                        : null,
                    shippingFlatRate: form.shippingFlatRate ? Number(form.shippingFlatRate) : 0,
                    social: form.social,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not save store settings");
            setNotice("Store settings saved.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    if (loadingSettings) {
        return (
            <div className="wg-box">
                <div className="body-text" style={{ padding: "40px 0", textAlign: "center" }}>
                    Loading store settings…
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
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
                <h5 className="mb-20">Store</h5>

                <fieldset className="mb-20">
                    <div className="body-title mb-10">
                        Store name <span className="tf-color-1">*</span>
                    </div>
                    <input
                        type="text"
                        value={form.storeName}
                        onChange={(e) => set("storeName", e.target.value)}
                        required
                    />
                </fieldset>

                <fieldset className="mb-20">
                    <div className="body-title mb-10">Tagline</div>
                    <input
                        type="text"
                        placeholder="Comfort you'll want to live in"
                        value={form.tagline}
                        onChange={(e) => set("tagline", e.target.value)}
                    />
                </fieldset>

                <fieldset className="mb-20">
                    <div className="body-title mb-10">Support email</div>
                    <input
                        type="email"
                        placeholder="support@velorrafashion.com"
                        value={form.supportEmail}
                        onChange={(e) => set("supportEmail", e.target.value)}
                    />
                </fieldset>

                <fieldset className="mb-20">
                    <div className="body-title mb-10">Phone</div>
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                    />
                </fieldset>

                <fieldset className="mb-20">
                    <div className="body-title mb-10">WhatsApp number</div>
                    <input
                        type="tel"
                        placeholder="923001234567"
                        value={form.whatsappNumber}
                        onChange={(e) => set("whatsappNumber", e.target.value)}
                    />
                    <div className="text-tiny mt-10">
                        Country code first, digits only — no +, spaces or dashes. Every contact
                        link on the storefront opens a WhatsApp chat with this number.
                    </div>
                </fieldset>

                <fieldset>
                    <div className="body-title mb-10">Address</div>
                    <textarea
                        rows={3}
                        value={form.address}
                        onChange={(e) => set("address", e.target.value)}
                    />
                </fieldset>
            </div>

            <div className="wg-box mb-30">
                <h5 className="mb-20">Currency & shipping</h5>

                <div className="cols-lg gap22">
                    <fieldset>
                        <div className="body-title mb-10">Currency code</div>
                        <input
                            type="text"
                            value={form.currency}
                            onChange={(e) => set("currency", e.target.value)}
                        />
                    </fieldset>

                    <fieldset>
                        <div className="body-title mb-10">Currency symbol</div>
                        <input
                            type="text"
                            value={form.currencySymbol}
                            onChange={(e) => set("currencySymbol", e.target.value)}
                        />
                    </fieldset>
                </div>

                <div className="cols-lg gap22 mt-20">
                    <fieldset>
                        <div className="body-title mb-10">Flat shipping rate</div>
                        <input
                            type="number"
                            min="0"
                            value={form.shippingFlatRate}
                            onChange={(e) => set("shippingFlatRate", e.target.value)}
                        />
                    </fieldset>

                    <fieldset>
                        <div className="body-title mb-10">Free shipping over</div>
                        <input
                            type="number"
                            min="0"
                            placeholder="Leave blank to disable"
                            value={form.freeShippingThreshold}
                            onChange={(e) => set("freeShippingThreshold", e.target.value)}
                        />
                    </fieldset>
                </div>
            </div>

            <div className="wg-box mb-30">
                <h5 className="mb-20">Social links</h5>
                {(["facebook", "instagram", "tiktok", "youtube"] as const).map((key) => (
                    <fieldset className="mb-20" key={key}>
                        <div className="body-title mb-10" style={{ textTransform: "capitalize" }}>
                            {key}
                        </div>
                        <input
                            type="url"
                            placeholder={`https://${key}.com/velorrafashion`}
                            value={form.social[key]}
                            onChange={(e) => set("social", { ...form.social, [key]: e.target.value })}
                        />
                    </fieldset>
                ))}
            </div>

            <div className="cols gap10">
                <button className="tf-button w-full" type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save store settings"}
                </button>
            </div>
        </form>
    );
}
