import Layout from "@/components/layout/Layout";
import { requirePermission } from "@/lib/guard";
import EditProductForm from "@/components/product/EditProductForm";
import Link from "next/link";
import React, { Suspense } from "react";

export const metadata = {
    title: "Edit Product — Soft & Comfort Admin",
    description: "Edit Product — Soft & Comfort Admin",
};

export default async function page() {
    await requirePermission("products");

    return (
        <>
            <Layout>
                <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                    <h3>Edit Product</h3>
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
                            <div className="text-tiny">Edit Product</div>
                        </li>
                    </ul>
                </div>
                <Suspense>
                    <EditProductForm />
                </Suspense>
            </Layout>
        </>
    );
}
