import Layout from "@/components/layout/Layout";
import AddNewUserForm from "@/components/user/AddNewUserForm";
import Link from "next/link";
import React from "react";

export const metadata = {
    title: "Add User — Velorra Admin",
    description: "Add User — Velorra Admin",
};

export default function page() {
    return (
        <>
            <Layout>
                <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                    <h3>Add New User</h3>
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
                            <Link href={"/all-user"}>
                                <div className="text-tiny">User</div>
                            </Link>
                        </li>
                        <li>
                            <i className="icon-chevron-right"></i>
                        </li>
                        <li>
                            <div className="text-tiny">Add New User</div>
                        </li>
                    </ul>
                </div>
                <AddNewUserForm />
            </Layout>
        </>
    );
}
