import Layout from "@/components/layout/Layout";
import { requirePermission } from "@/lib/guard";
import ProductListClient from "@/components/product/ProductListClient";
import EmptyState from "@/components/common/EmptyState";
import { listProducts } from "@/lib/sanity/catalog";
import { productToRow } from "@/lib/sanity/toTableRows";
import { isSanityConfigured } from "@/lib/sanity/client";
import Link from "next/link";

export const metadata = {
    title: "All Products — Soft & Comfort Admin",
    description: "Manage the Soft & Comfort product catalogue",
};

// always read fresh: the dashboard must show its own writes immediately
export const dynamic = "force-dynamic";

export default async function AllProductPage() {
    await requirePermission("products");

    let rows: ReturnType<typeof productToRow>[] = [];
    let loadError: string | null = null;

    if (isSanityConfigured) {
        try {
            rows = (await listProducts()).map(productToRow);
        } catch (error) {
            console.error("ALL_PRODUCTS_LOAD_ERROR", error);
            loadError = "Could not load products from Sanity. Check SANITY_API_TOKEN in .env.local.";
        }
    } else {
        loadError = "Sanity is not configured. Add NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN to .env.local.";
    }

    return (
        <Layout>
            <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                <h3>All Products</h3>
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
                        <div className="text-tiny">All Products</div>
                    </li>
                </ul>
            </div>

            {loadError ? (
                <EmptyState title="Products unavailable" message={loadError} />
            ) : rows.length === 0 ? (
                <EmptyState
                    title="No products yet"
                    message="Your catalogue is empty. Add your first product to see it here and on the storefront."
                    actionHref="/add-product"
                    actionLabel="Add product"
                />
            ) : (
                <ProductListClient products={rows} />
            )}
        </Layout>
    );
}
