import "server-only";
import { catalogClient } from "./client";

/**
 * Customer reviews.
 *
 * Stored in the public catalogue dataset so the storefront can read them
 * without a token, which is also why the record holds nothing but a display
 * name, an optional city and the quote itself.
 */

export type Review = {
    _id: string;
    customerName: string;
    city: string | null;
    rating: number;
    quote: string;
    productId: string | null;
    productTitle: string | null;
    published: boolean;
    createdAt: string | null;
};

const REVIEW_PROJECTION = `{
    _id, customerName, city, rating, quote,
    "productId": product._ref,
    "productTitle": product->title,
    "published": coalesce(published, true),
    createdAt
}`;

export async function listReviews(): Promise<Review[]> {
    return catalogClient().fetch(
        `*[_type == "review"] | order(coalesce(createdAt, _createdAt) desc) ${REVIEW_PROJECTION}`
    );
}

export type ReviewInput = {
    customerName: string;
    city?: string | null;
    rating: number;
    quote: string;
    productId?: string | null;
    published?: boolean;
};

function toDocument(input: ReviewInput) {
    return {
        customerName: input.customerName.trim(),
        city: input.city?.trim() || null,
        rating: Math.min(5, Math.max(1, Math.round(input.rating))),
        quote: input.quote.trim(),
        product: input.productId ? { _type: "reference", _ref: input.productId } : null,
        published: input.published !== false,
    };
}

export async function createReview(input: ReviewInput): Promise<{ _id: string }> {
    const doc = await catalogClient().create({
        _type: "review",
        ...toDocument(input),
        createdAt: new Date().toISOString(),
    });
    return { _id: doc._id };
}

export async function updateReview(id: string, input: ReviewInput): Promise<void> {
    const doc = toDocument(input);
    const patch = catalogClient().patch(id).set(doc);
    // a cleared product has to be unset, not set to null, or the reference
    // stays in the document as an empty object
    await (doc.product ? patch : patch.unset(["product"])).commit();
}

export async function deleteReview(id: string): Promise<void> {
    await catalogClient().delete(id);
}
