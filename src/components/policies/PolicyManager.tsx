"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { POLICY_PAGES, blocksToText, type Policy, type PolicySlug } from "@/lib/policyPages";

/**
 * Policy editor.
 *
 * Intentionally starts blank. The template shipped pre-written policies that
 * claimed the store ran on Shopify and Google Analytics and named a company
 * that is not Soft & Comfort — a legal page stating things that are untrue is worse
 * than no page, so these are the owner's words or nothing.
 */
export default function PolicyManager({ policies }: { policies: Policy[] }) {
    const router = useRouter();
    const byslug = new Map(policies.map((p) => [p.slug, p]));

    const [active, setActive] = useState<PolicySlug>("privacy");
    const current = byslug.get(active);
    const meta = POLICY_PAGES.find((p) => p.slug === active)!;

    const [title, setTitle] = useState(current?.title ?? meta.title);
    const [text, setText] = useState(blocksToText(current?.body));
    const [published, setPublished] = useState(current?.published ?? false);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    function switchTo(slug: PolicySlug) {
        const next = byslug.get(slug);
        const nextMeta = POLICY_PAGES.find((p) => p.slug === slug)!;
        setActive(slug);
        setTitle(next?.title ?? nextMeta.title);
        setText(blocksToText(next?.body));
        setPublished(next?.published ?? false);
        setError(null);
        setNotice(null);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setNotice(null);
        setSaving(true);
        try {
            const res = await fetch("/api/policies", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug: active, title, text, published }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not save the policy");

            setNotice(published ? "Saved and published." : "Saved as a draft.");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
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
                <div className="flex gap10 flex-wrap">
                    {POLICY_PAGES.map((p) => {
                        const saved = byslug.get(p.slug);
                        const isActive = p.slug === active;
                        return (
                            <button
                                key={p.slug}
                                type="button"
                                className={isActive ? "tf-button" : "tf-button style-3"}
                                onClick={() => switchTo(p.slug)}
                            >
                                {p.title}
                                {saved?.published ? " ✓" : ""}
                            </button>
                        );
                    })}
                </div>
                <div className="text-tiny mt-20">
                    A tick means that policy is published and live on the storefront.
                </div>
            </div>

            <div className="wg-box mb-30">
                <h5 className="mb-10">{meta.title}</h5>
                <div className="text-tiny mb-20">{meta.hint}</div>

                <fieldset className="mb-20">
                    <div className="body-title mb-10">
                        Page title <span className="tf-color-1">*</span>
                    </div>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </fieldset>

                <fieldset>
                    <div className="body-title mb-10">Content</div>
                    <textarea
                        rows={18}
                        placeholder={`Write your ${meta.title.toLowerCase()} here.\n\nLeave a blank line between paragraphs.\n\n## A line starting with "## " (or written in CAPITALS) becomes a heading.`}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <div className="text-tiny mt-10">
                        Blank lines separate paragraphs. This is your own wording — nothing is
                        pre-filled, because a policy that does not match how you actually operate is
                        a liability rather than a formality.
                    </div>
                </fieldset>

                <label className="flex items-center gap10 mt-20" style={{ cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={published}
                        onChange={(e) => setPublished(e.target.checked)}
                    />
                    <span className="body-title-2">
                        Publish on the storefront
                        {!text.trim() && (
                            <span className="text-tiny" style={{ display: "block" }}>
                                Add content first — an empty policy cannot be published.
                            </span>
                        )}
                    </span>
                </label>

                {current?.updatedAt && (
                    <div className="text-tiny mt-20">
                        Last saved{" "}
                        {new Date(current.updatedAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </div>
                )}
            </div>

            <div className="cols gap10">
                <button className="tf-button w-full" type="submit" disabled={saving}>
                    {saving ? "Saving…" : `Save ${meta.title}`}
                </button>
            </div>
        </form>
    );
}
