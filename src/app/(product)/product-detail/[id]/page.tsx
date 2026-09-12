import Layout from "@/components/layout/Layout";
import EmptyState from "@/components/common/EmptyState";
import ProductDetailView from "@/components/product/ProductDetailView";
import { getProduct } from "@/lib/sanity/catalog";
import { isSanityConfigured } from "@/lib/sanity/client";
import Link from "next/link";

export const metadata = {
    title: "Product Detail — Soft & Comfort Admin",
    description: "Soft & Comfort product detail",
};

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const breadcrumbs = (
        <div className="flex items-center flex-wrap justify-between gap20 mb-30">
            <h3>Product Detail</h3>
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
                    <Link href={"/all-product"}>
                        <div className="text-tiny">Product</div>
                    </Link>
                </li>
                <li>
                    <i className="icon-chevron-right"></i>
                </li>
                <li>
                    <div className="text-tiny">Product Detail</div>
                </li>
            </ul>
        </div>
    );

    if (!isSanityConfigured) {
        return (
            <Layout>
                {breadcrumbs}
                <EmptyState
                    title="Product unavailable"
                    message="Sanity is not configured. Add NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN to .env.local."
                />
            </Layout>
        );
    }

    try {
        const product = await getProduct(id);
        if (!product) {
            return (
                <Layout>
                    {breadcrumbs}
                    <EmptyState
                        title="Product not found"
                        message="This product may have been deleted."
                        actionHref="/all-product"
                        actionLabel="Back to products"
                    />
                </Layout>
            );
        }

        return (
            <Layout>
                {breadcrumbs}
                <ProductDetailView product={product} />
            </Layout>
        );
    } catch (error) {
        console.error("PRODUCT_DETAIL_LOAD_ERROR", error);
        return (
            <Layout>
                {breadcrumbs}
                <EmptyState
                    title="Product unavailable"
                    message="Could not load this product from Sanity. Check SANITY_API_TOKEN in .env.local."
                />
            </Layout>
        );
    }
}
