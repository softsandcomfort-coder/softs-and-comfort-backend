import Layout from "@/components/layout/Layout";
import OrderListClient from "@/components/order/OrderListClient";
import EmptyState from "@/components/common/EmptyState";
import { listOrders } from "@/lib/sanity/orders";
import { money } from "@/lib/sanity/toTableRows";
import { isSanityConfigured } from "@/lib/sanity/client";
import type { Product } from "@/types/models";
import Link from "next/link";

export const metadata = {
    title: "Orders — Soft & Comfort Admin",
    description: "Soft & Comfort customer orders",
};

export const dynamic = "force-dynamic";

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function OrderListPage() {
    let rows: Product[] = [];
    let loadError: string | null = null;

    if (isSanityConfigured) {
        try {
            // mapped into the template's row shape so the existing table renders it
            rows = (await listOrders()).map((o) => ({
                id: o._id,
                productId: o.orderNumber,
                name: o.customerName ?? "Guest",
                image: o.lines?.[0]?.image || "/images/products/1.png",
                price: money(o.total),
                quantity: (o.lines ?? []).reduce((n, l) => n + (l.qty ?? 0), 0),
                payment: o.total,
                status: titleCase(o.status),
                category: o.paymentMethod ?? "cod",
            }));
        } catch (error) {
            console.error("ORDER_LIST_LOAD_ERROR", error);
            loadError = "Could not load orders from Sanity. Check SANITY_API_TOKEN in .env.local.";
        }
    } else {
        loadError =
            "Sanity is not configured. Add NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN to .env.local.";
    }

    return (
        <Layout>
            <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                <h3>Order List</h3>
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
                        <div className="text-tiny">Order List</div>
                    </li>
                </ul>
            </div>

            {loadError ? (
                <EmptyState title="Orders unavailable" message={loadError} />
            ) : rows.length === 0 ? (
                <EmptyState
                    title="No orders yet"
                    message="Orders placed through the storefront checkout will appear here."
                />
            ) : (
                <OrderListClient orders={rows} />
            )}
        </Layout>
    );
}
