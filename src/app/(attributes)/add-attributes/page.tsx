import { Suspense } from "react";
import { requirePermission } from "@/lib/guard";
import AddAttributesForm from "@/components/attributes/AddAttributesForm";
import AttributeTable from "@/components/attributes/AttributeTable";
import Layout from "@/components/layout/Layout";
import OrderListTable from "@/components/order/OrderListTable";
import Link from "next/link";
import React from "react";

export const metadata = {
    title: "Add Attribute — Soft & Comfort Admin",
    description: "Add Attribute — Soft & Comfort Admin",
};

export default async function page() {
    await requirePermission("products");

    return (
        <>
            <Layout>
                <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                    <h3>Add Attributes</h3>
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
                            <Link href={"/all-attributes"}>
                                <div className="text-tiny">Attributes</div>
                            </Link>
                        </li>
                        <li>
                            <i className="icon-chevron-right"></i>
                        </li>
                        <li>
                            <div className="text-tiny">Add Attributes</div>
                        </li>
                    </ul>
                </div>
                <Suspense>
                    <AddAttributesForm />
                </Suspense>
            </Layout>
        </>
    );
}
