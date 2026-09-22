/**
 * Policy shapes and pure helpers, safe on both sides of the RSC boundary.
 *
 * Deliberately free of the `server-only` Sanity client: the policy editor is a
 * client component and needs the page list and the text/Portable-Text
 * converters, which have nothing to do with fetching.
 */

export type PolicySlug = "privacy" | "terms" | "shipping" | "returns" | "about" | "faq";

export const POLICY_PAGES: { slug: PolicySlug; title: string; hint: string }[] = [
    {
        slug: "privacy",
        title: "Privacy Policy",
        hint: "What customer data you collect, why, and who it is shared with.",
    },
    {
        slug: "terms",
        title: "Terms & Conditions",
        hint: "Rules of sale, liability and the governing jurisdiction.",
    },
    {
        slug: "shipping",
        title: "Shipping Policy",
        hint: "Delivery times, charges and the areas you cover.",
    },
    {
        slug: "returns",
        title: "Returns & Exchanges",
        hint: "Return window and process. Intimates usually need hygiene-specific wording.",
    },
    {
        slug: "about",
        title: "About Us",
        hint: "Shown at /about-us. Who you are and what the store stands for.",
    },
    {
        slug: "faq",
        title: "FAQs",
        hint: "Shown at /faqs. Mark each question as a heading and put the answer under it.",
    },
];

/** Portable Text block, kept loose — the editor owns the shape. */
export type PolicyBlock = Record<string, unknown>;

export type Policy = {
    _id: string;
    title: string;
    slug: PolicySlug;
    body: PolicyBlock[] | null;
    published: boolean;
    updatedAt: string | null;
};

/**
 * A paragraph becomes a heading when it starts with "## ", or when it is a
 * single short line written in capitals ("DELIVERY TIME") — the style the
 * published policies already use. FAQ questions work the same way.
 */
function headingText(para: string): string | null {
    if (para.startsWith("## ")) return para.slice(3).trim();
    const isShortCapsLine =
        !para.includes("\n") && para.length <= 60 && /[A-Z]/.test(para) && para === para.toUpperCase();
    return isShortCapsLine ? para : null;
}

/**
 * Converts plain text (what the dashboard textarea produces) into Portable Text
 * blocks, one per paragraph, so the same document also opens correctly in the
 * Studio's rich-text editor.
 */
export function textToBlocks(text: string): PolicyBlock[] {
    return text
        .split(/\n{2,}/)
        .map((para) => para.trim())
        .filter(Boolean)
        .map((para, i) => {
            const heading = headingText(para);
            return {
                _type: "block",
                _key: `block-${i}`,
                style: heading ? "h3" : "normal",
                markDefs: [],
                children: [{ _type: "span", _key: `span-${i}`, text: heading ?? para, marks: [] }],
            };
        });
}

/** The inverse, so the dashboard textarea can load an existing policy. */
export function blocksToText(blocks: PolicyBlock[] | null | undefined): string {
    if (!Array.isArray(blocks)) return "";
    return blocks
        .map((block) => {
            const { children, style } = block as { children?: { text?: string }[]; style?: string };
            if (!Array.isArray(children)) return "";
            const text = children.map((c) => c?.text ?? "").join("");
            // capitals already read as a heading; anything else needs the "## " marker back
            const isHeading = style === "h3" || style === "h4";
            return text && isHeading && text !== text.toUpperCase() ? `## ${text}` : text;
        })
        .filter(Boolean)
        .join("\n\n");
}
