import Layout from "@/components/layout/Layout";
import { requirePermission } from "@/lib/guard";
import StoreSettingForm from "@/components/orther-page/StoreSettingForm";
import Link from "next/link";
import React from "react";

export const metadata = {
    title: "Store Settings — Soft & Comfort Admin",
    description: "Store Settings — Soft & Comfort Admin",
};

export default async function page() {
    await requirePermission("settings");

    return (
        <>
            <Layout>
                <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                    <h3>Store Setting</h3>
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
                            <div className="text-tiny">Store Setting</div>
                        </li>
                    </ul>
                </div>
                <StoreSettingForm />
            </Layout>
        </>
    );
}
