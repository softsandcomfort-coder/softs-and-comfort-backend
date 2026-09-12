import Layout from "@/components/layout/Layout";
import AddProductForm from "@/components/product/AddProductForm";
import Link from "next/link";
import React from "react";

export const metadata = {
    title: "Add Product — Soft & Comfort Admin",
    description: "Add Product — Soft & Comfort Admin",
};

export default function page() {
    return (
        <>
            <Layout>
                <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                    <h3>Add Product</h3>
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
                            <div className="text-tiny">Add Product</div>
                        </li>
                    </ul>
                </div>
                <AddProductForm />
            </Layout>
        </>
    );
}
