import Layout from "@/components/layout/Layout";
import { requirePermission } from "@/lib/guard";
import AttributeListClient from "@/components/attributes/AttributeListClient";
import EmptyState from "@/components/common/EmptyState";
import { listAttributes } from "@/lib/sanity/catalog";
import { isSanityConfigured } from "@/lib/sanity/client";
import type { AttributeItem } from "@/lib/sanity/catalog";
import Link from "next/link";

export const metadata = {
    title: "Attributes — Soft & Comfort Admin",
    description: "Manage Soft & Comfort product attributes",
};

export const dynamic = "force-dynamic";

export default async function AllAttributesPage() {
    await requirePermission("products");

    let rows: AttributeItem[] = [];
    let loadError: string | null = null;

    if (isSanityConfigured) {
        try {
            rows = await listAttributes();
        } catch (error) {
            console.error("ALL_ATTRIBUTES_LOAD_ERROR", error);
            loadError = "Could not load attributes from Sanity. Check SANITY_API_TOKEN in .env.local.";
        }
    } else {
        loadError =
            "Sanity is not configured. Add NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN to .env.local.";
    }

    return (
        <Layout>
            <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                <h3>Attributes</h3>
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
                        <div className="text-tiny">Attributes</div>
                    </li>
                </ul>
            </div>

            {loadError ? (
                <EmptyState title="Attributes unavailable" message={loadError} />
            ) : rows.length === 0 ? (
                <EmptyState
                    title="No attributes yet"
                    message="Attributes are reusable value sets (fabric, fit) you can pull into product tags."
                    actionHref="/add-attributes"
                    actionLabel="Add attribute"
                />
            ) : (
                <AttributeListClient attributes={rows} />
            )}
        </Layout>
    );
}
