/**
 * Policy shapes and pure helpers, safe on both sides of the RSC boundary.
 *
 * Deliberately free of the `server-only` Sanity client: the policy editor is a
 * client component and needs the page list and the text/Portable-Text
 * converters, which have nothing to do with fetching.
 */

export type PolicySlug = "privacy" | "terms" | "shipping" | "returns";

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
 * Converts plain text (what the dashboard textarea produces) into Portable Text
 * blocks, one per paragraph, so the same document also opens correctly in the
 * Studio's rich-text editor.
 */
export function textToBlocks(text: string): PolicyBlock[] {
    return text
        .split(/\n{2,}/)
        .map((para) => para.trim())
        .filter(Boolean)
        .map((para, i) => ({
            _type: "block",
            _key: `block-${i}`,
            style: "normal",
            markDefs: [],
            children: [{ _type: "span", _key: `span-${i}`, text: para, marks: [] }],
        }));
}

/** The inverse, so the dashboard textarea can load an existing policy. */
export function blocksToText(blocks: PolicyBlock[] | null | undefined): string {
    if (!Array.isArray(blocks)) return "";
    return blocks
        .map((block) => {
            const children = (block as { children?: { text?: string }[] }).children;
            if (!Array.isArray(children)) return "";
            return children.map((c) => c?.text ?? "").join("");
        })
        .filter(Boolean)
        .join("\n\n");
}
