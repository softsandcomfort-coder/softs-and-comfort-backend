import "server-only";
import { catalogClient } from "./client";
import type { Policy, PolicyBlock, PolicySlug } from "../policyPages";

/**
 * Policy reads and writes. Stored in the public catalogue dataset so the
 * storefront can fetch them without a token.
 *
 * The shapes and the text/Portable-Text converters live in ../policyPages so the
 * client-side editor can use them without pulling this server-only module in.
 */

export type { Policy, PolicyBlock, PolicySlug };
export { POLICY_PAGES, textToBlocks, blocksToText } from "../policyPages";

const PROJECTION = `{ _id, title, slug, body, published, updatedAt }`;

export async function listPolicies(): Promise<Policy[]> {
    return catalogClient().fetch(`*[_type == "policy"] | order(slug asc) ${PROJECTION}`);
}

export async function getPolicy(slug: PolicySlug): Promise<Policy | null> {
    return catalogClient().fetch(`*[_type == "policy" && slug == $slug][0] ${PROJECTION}`, { slug });
}

/**
 * Upserts by slug with a deterministic id, so saving the same policy twice
 * updates it rather than creating a second page.
 */
export async function savePolicy(input: {
    slug: PolicySlug;
    title: string;
    body: PolicyBlock[];
    published: boolean;
}): Promise<void> {
    await catalogClient().createOrReplace({
        _id: `policy-${input.slug}`,
        _type: "policy",
        slug: input.slug,
        title: input.title,
        body: input.body,
        published: input.published,
        updatedAt: new Date().toISOString(),
    });
}
