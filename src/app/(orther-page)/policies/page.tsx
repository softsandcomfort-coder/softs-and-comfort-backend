import Layout from "@/components/layout/Layout";
import EmptyState from "@/components/common/EmptyState";
import PolicyManager from "@/components/policies/PolicyManager";
import { listPolicies, type Policy } from "@/lib/sanity/policies";
import { isSanityConfigured } from "@/lib/sanity/client";
import Link from "next/link";

export const metadata = {
    title: "Policies — Velorra Admin",
    description: "Edit Velorra Fashion customer policies",
};

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
    let policies: Policy[] = [];
    let loadError: string | null = null;

    if (isSanityConfigured) {
        try {
            policies = await listPolicies();
        } catch (error) {
            console.error("POLICIES_LOAD_ERROR", error);
            loadError = "Could not load policies from Sanity. Check SANITY_API_TOKEN in .env.local.";
        }
    } else {
        loadError =
            "Sanity is not configured. Add NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN to .env.local.";
    }

    return (
        <Layout>
            <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                <h3>Policies</h3>
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
                        <div className="text-tiny">Policies</div>
                    </li>
                </ul>
            </div>

            {loadError ? (
                <EmptyState title="Policies unavailable" message={loadError} />
            ) : (
                <PolicyManager policies={policies} />
            )}
        </Layout>
    );
}
