import Layout from "@/components/layout/Layout";
import { requirePermission } from "@/lib/guard";
import CategoryListClient from "@/components/category/CategoryListClient";
import EmptyState from "@/components/common/EmptyState";
import { listCategories } from "@/lib/sanity/catalog";
import { categoryToRow } from "@/lib/sanity/toTableRows";
import { isSanityConfigured } from "@/lib/sanity/client";
import type { Category } from "@/types/models";
import Link from "next/link";

export const metadata = {
    title: "Categories — Soft & Comfort Admin",
    description: "Manage Soft & Comfort product categories",
};

export const dynamic = "force-dynamic";

export default async function AllCategoryPage() {
    await requirePermission("categories");

    let rows: Category[] = [];
    let loadError: string | null = null;

    if (isSanityConfigured) {
        try {
            // categoryToRow returns the template's row shape; it overlaps the
            // table's Category type on every field the table actually renders
            rows = (await listCategories()).map(categoryToRow) as unknown as Category[];
        } catch (error) {
            console.error("ALL_CATEGORIES_LOAD_ERROR", error);
            loadError = "Could not load categories from Sanity. Check SANITY_API_TOKEN in .env.local.";
        }
    } else {
        loadError =
            "Sanity is not configured. Add NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN to .env.local.";
    }

    return (
        <Layout>
            <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                <h3>Categories</h3>
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
                        <div className="text-tiny">Categories</div>
                    </li>
                </ul>
            </div>

            {loadError ? (
                <EmptyState title="Categories unavailable" message={loadError} />
            ) : rows.length === 0 ? (
                <EmptyState
                    title="No categories yet"
                    message="Products need a category before they can be published. Create your first one to get started."
                    actionHref="/add-category"
                    actionLabel="Add category"
                />
            ) : (
                <CategoryListClient categories={rows} />
            )}
        </Layout>
    );
}
