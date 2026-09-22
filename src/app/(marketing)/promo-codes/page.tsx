import Layout from "@/components/layout/Layout";
import { requirePermission } from "@/lib/guard";
import EmptyState from "@/components/common/EmptyState";
import PromoManager from "@/components/promo/PromoManager";
import { listPromoCodes, type PromoCode } from "@/lib/sanity/promo";
import { isSanityConfigured } from "@/lib/sanity/client";
import Link from "next/link";

export const metadata = {
    title: "Promo Codes — Soft & Comfort Admin",
    description: "Manage Soft & Comfort discount codes",
};

export const dynamic = "force-dynamic";

export default async function PromoCodesPage() {
    await requirePermission("marketing");

    let promoCodes: PromoCode[] = [];
    let loadError: string | null = null;

    if (isSanityConfigured) {
        try {
            promoCodes = await listPromoCodes();
        } catch (error) {
            console.error("PROMO_CODES_LOAD_ERROR", error);
            loadError = "Could not load promo codes from Sanity. Check SANITY_API_TOKEN in .env.local.";
        }
    } else {
        loadError =
            "Sanity is not configured. Add NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN to .env.local.";
    }

    return (
        <Layout>
            <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                <h3>Promo Codes</h3>
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
                        <div className="text-tiny">Promo Codes</div>
                    </li>
                </ul>
            </div>

            {loadError ? (
                <EmptyState title="Promo codes unavailable" message={loadError} />
            ) : (
                <PromoManager promoCodes={promoCodes} />
            )}
        </Layout>
    );
}
