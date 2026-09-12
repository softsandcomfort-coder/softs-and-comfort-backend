import Layout from "@/components/layout/Layout";
import EmptyState from "@/components/common/EmptyState";
import OrderTrackingView from "@/components/order/OrderTrackingView";
import { getOrder } from "@/lib/sanity/orders";
import { isSanityConfigured } from "@/lib/sanity/client";
import Link from "next/link";

export const metadata = {
    title: "Order Tracking — Soft & Comfort Admin",
    description: "Soft & Comfort order progress",
};

export const dynamic = "force-dynamic";

export default async function OrderTrackingPage({
    searchParams,
}: {
    searchParams: Promise<{ id?: string }>;
}) {
    const { id } = await searchParams;

    const breadcrumbs = (
        <div className="flex items-center flex-wrap justify-between gap20 mb-30">
            <h3>Order Tracking</h3>
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
                    <Link href={"/order-list"}>
                        <div className="text-tiny">Order</div>
                    </Link>
                </li>
                <li>
                    <i className="icon-chevron-right"></i>
                </li>
                <li>
                    <div className="text-tiny">Order Tracking</div>
                </li>
            </ul>
        </div>
    );

    if (!isSanityConfigured) {
        return (
            <Layout>
                {breadcrumbs}
                <EmptyState
                    title="Tracking unavailable"
                    message="Sanity is not configured. Add NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN to .env.local."
                />
            </Layout>
        );
    }

    if (!id) {
        return (
            <Layout>
                {breadcrumbs}
                <EmptyState
                    title="No order selected"
                    message="Open an order from the order list to track it."
                    actionHref="/order-list"
                    actionLabel="Go to orders"
                />
            </Layout>
        );
    }

    try {
        const order = await getOrder(id);
        if (!order) {
            return (
                <Layout>
                    {breadcrumbs}
                    <EmptyState
                        title="Order not found"
                        message="This order may have been deleted."
                        actionHref="/order-list"
                        actionLabel="Back to orders"
                    />
                </Layout>
            );
        }

        return (
            <Layout>
                {breadcrumbs}
                <OrderTrackingView order={order} />
            </Layout>
        );
    } catch (error) {
        console.error("ORDER_TRACKING_LOAD_ERROR", error);
        return (
            <Layout>
                {breadcrumbs}
                <EmptyState
                    title="Tracking unavailable"
                    message="Could not load this order from Sanity. Check SANITY_API_TOKEN in .env.local."
                />
            </Layout>
        );
    }
}
