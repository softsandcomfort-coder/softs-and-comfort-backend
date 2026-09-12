import Layout from "@/components/layout/Layout";
import SettingForm from "@/components/orther-page/SettingForm";
import Link from "next/link";
import React from "react";

export const metadata = {
    title: "Settings — Velorra Admin",
    description: "Settings — Velorra Admin",
};

export default function page() {
    return (
        <>
            <Layout>
                <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                    <h3>Setting</h3>
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
                            <div className="text-tiny">Setting</div>
                        </li>
                    </ul>
                </div>
                <SettingForm />
            </Layout>
        </>
    );
}
