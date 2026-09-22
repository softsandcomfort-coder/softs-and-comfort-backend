import Layout from "@/components/layout/Layout";
import { requirePermission } from "@/lib/guard";
import EmptyState from "@/components/common/EmptyState";
import RevenueChart3 from "@/components/chart/RevenueChart3";
import TopCustomers from "@/components/widgets/TopCustomers";
import TopProducts from "@/components/widgets/TopProducts";
import OrderHistory, { type OrderHistoryRow } from "@/components/widgets/OrderHistory";
import { getDashboardData, formatPkr } from "@/lib/sanity/analytics";
import { buildRevenueChartData } from "@/lib/sanity/dashboardProps";
import { listOrders } from "@/lib/sanity/orders";
import { isSanityConfigured } from "@/lib/sanity/client";
import Link from "next/link";

export const metadata = {
    title: "Report — Soft & Comfort Admin",
    description: "Soft & Comfort sales report",
};

export const dynamic = "force-dynamic";

const shortDate = (iso: string | null | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
        ? ""
        : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/**
 * Sales report.
 *
 * Every widget here was fabricated in the template: a hardcoded "transfer
 * history" of invented people and dollar amounts, a "top page posts" table of
 * page views and exit rates, and a customer list of stock photos. All three are
 * replaced with the real equivalents this store can actually measure.
 */
export default async function ReportPage() {
    await requirePermission("orders");

    if (!isSanityConfigured) {
        return (
            <Layout>
                <EmptyState
                    title="Report unavailable"
                    message="Sanity is not configured. Add NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN to .env.local."
                />
            </Layout>
        );
    }

    try {
        const [data, orders] = await Promise.all([getDashboardData(), listOrders()]);

        const revenueData = buildRevenueChartData(data);

        const topCustomers = data.topCustomers.map((c, i) => ({
            id: c.email || i,
            name: c.name,
            purchases: c.purchases,
            total: formatPkr(c.total),
            image: `/images/customers/customer-${(i % 4) + 1}.jpg`,
        }));

        const historyRows: OrderHistoryRow[] = orders.map((o) => ({
            id: o._id,
            orderNumber: o.orderNumber,
            customer: o.customerName ?? "Guest",
            email: o.customerEmail ?? "",
            date: shortDate(o.createdAt),
            total: o.total ?? 0,
            status: o.status,
        }));

        return (
            <Layout>
                <div className="flex items-center flex-wrap justify-between gap20 mb-30">
                    <h3>Report</h3>
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
                            <div className="text-tiny">Report</div>
                        </li>
                    </ul>
                </div>

                <div className="tf-section-1 mb-30">
                    <RevenueChart3 revenueData={revenueData} />
                    <div className="flex gap20 flex-wrap-mobile">
                        <TopProducts items={data.topProducts} />
                        <TopCustomers
                            customers={topCustomers}
                            emptyMessage="No customers yet — they'll appear here after the first order."
                        />
                    </div>
                </div>

                <OrderHistory rows={historyRows} />
            </Layout>
        );
    } catch (error) {
        console.error("REPORT_LOAD_ERROR", error);
        return (
            <Layout>
                <EmptyState
                    title="Report unavailable"
                    message="Could not load report data from Sanity. Check SANITY_API_TOKEN in .env.local."
                />
            </Layout>
        );
    }
}
