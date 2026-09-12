import Layout from "@/components/layout/Layout";
import EditProductForm from "@/components/product/EditProductForm";
import Link from "next/link";
import React, { Suspense } from "react";

export const metadata = {
    title: "Edit Product — Velorra Admin",
    description: "Edit Product — Velorra Admin",
};

export default function page() {
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
