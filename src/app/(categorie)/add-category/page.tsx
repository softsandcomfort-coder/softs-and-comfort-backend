import AddCategoryForm from "@/components/category/AddCategoryForm";
import { requirePermission } from "@/lib/guard";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
    title: "Add Category — Soft & Comfort Admin",
    description: "Add Category — Soft & Comfort Admin",
};

/** Same page for both: "?id=" switches the form into edit mode. */
export default async function page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
    await requirePermission("categories");

    const { id } = await searchParams;
    const heading = id ? "Edit Category" : "Add Category";
    return (
        <>
            <Layout>
                <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                    <h3>{heading}</h3>
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
                            <Link href={"/all-category"}>
                                <div className="text-tiny">All Category</div>
                            </Link>
                        </li>
                        <li>
                            <i className="icon-chevron-right"></i>
                        </li>
                        <li>
                            <div className="text-tiny">{heading}</div>
                        </li>
                    </ul>
                </div>
                <Suspense fallback={<div className="wg-box"><div className="body-text">Loading…</div></div>}>
                    <AddCategoryForm />
                </Suspense>
            </Layout>
        </>
    );
}
