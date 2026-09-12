import Layout from "@/components/layout/Layout";
import UserListClient from "@/components/user/UserListClient";
import EmptyState from "@/components/common/EmptyState";
import type { UserRow } from "@/components/user/UserListTable";
import { listUsers, getSession } from "@/lib/auth";
import { isSanityConfigured } from "@/lib/sanity/client";
import Link from "next/link";

export const metadata = {
    title: "Users — Soft & Comfort Admin",
    description: "Manage Soft & Comfort dashboard accounts",
};

export const dynamic = "force-dynamic";

export default async function AllUserPage() {
    let rows: UserRow[] = [];
    let currentUserId: string | undefined;
    let loadError: string | null = null;

    if (isSanityConfigured) {
        try {
            const [users, session] = await Promise.all([listUsers(), getSession()]);
            currentUserId = session?.sub;
            rows = users.map((u) => ({
                id: u._id,
                name: u.name,
                email: u.email,
                role: u.role === "owner" ? "Owner" : "Staff",
                permissions: u.permissions ?? [],
                active: u.active !== false,
                createdAt: (u as { createdAt?: string }).createdAt ?? "",
            }));
        } catch (error) {
            console.error("ALL_USERS_LOAD_ERROR", error);
            loadError = "Could not load users from Sanity. Check SANITY_API_TOKEN in .env.local.";
        }
    } else {
        loadError =
            "Sanity is not configured. Add NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN to .env.local.";
    }

    return (
        <Layout>
            <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                <h3>All Users</h3>
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
                        <div className="text-tiny">All Users</div>
                    </li>
                </ul>
            </div>

            {loadError ? (
                <EmptyState title="Users unavailable" message={loadError} />
            ) : rows.length === 0 ? (
                <EmptyState
                    title="No dashboard accounts"
                    message="Create the first account from a terminal with: npm run create:admin <email> <password>"
                    actionHref="/add-new-user"
                    actionLabel="Add user"
                />
            ) : (
                <UserListClient users={rows} currentUserId={currentUserId} />
            )}
        </Layout>
    );
}
