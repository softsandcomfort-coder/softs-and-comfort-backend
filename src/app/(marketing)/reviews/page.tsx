import Layout from "@/components/layout/Layout";
import EmptyState from "@/components/common/EmptyState";
import ReviewManager from "@/components/reviews/ReviewManager";
import { listReviews, type Review } from "@/lib/sanity/reviews";
import { listProducts } from "@/lib/sanity/catalog";
import { isSanityConfigured } from "@/lib/sanity/client";
import Link from "next/link";

export const metadata = {
    title: "Reviews — Soft & Comfort Admin",
    description: "Customer reviews shown on the Soft & Comfort storefront",
};

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
    let reviews: Review[] = [];
    let products: { _id: string; title: string }[] = [];
    let loadError: string | null = null;

    if (isSanityConfigured) {
        try {
            const [loadedReviews, loadedProducts] = await Promise.all([listReviews(), listProducts()]);
            reviews = loadedReviews;
            products = loadedProducts.map((p) => ({ _id: p._id, title: p.title }));
        } catch (error) {
            console.error("REVIEWS_LOAD_ERROR", error);
            loadError = "Could not load reviews from Sanity. Check SANITY_API_TOKEN in .env.local.";
        }
    } else {
        loadError =
            "Sanity is not configured. Add NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN to .env.local.";
    }

    return (
        <Layout>
            <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                <h3>Reviews</h3>
                <ul className="breadcrumbs flex items-center flex-wrap justify-start gap10">
                    <li>
                        <Link href={"/"}>
                            <div className="text-tiny">Dashboard</div>
                        </Link>
                    </li>
                    <li>
                        <i className="icon-chevron-right"></i>
                    </li>
                    <li>
                        <div className="text-tiny">Reviews</div>
                    </li>
                </ul>
            </div>

            {loadError ? (
                <EmptyState title="Reviews unavailable" message={loadError} />
            ) : (
                <ReviewManager reviews={reviews} products={products} />
            )}
        </Layout>
    );
}
