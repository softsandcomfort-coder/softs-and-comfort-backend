import Layout from "@/components/layout/Layout";
import EmptyState from "@/components/common/EmptyState";
import StartsCard2 from "@/components/chart/StartsCard2";
import RevenueChart3 from "@/components/chart/RevenueChart3";
import TrafficSources from "@/components/chart/TrafficSources";
import TopCustomers from "@/components/widgets/TopCustomers";
import RecentOrder2 from "@/components/widgets/RecentOrder2";
import LowStockProducts from "@/components/widgets/LowStockProducts";
import { getDashboardData, formatPkr } from "@/lib/sanity/analytics";
import {
    buildStatCards,
    buildRevenueChartData,
    buildOrderStatusDonut,
    buildRecentOrders,
} from "@/lib/sanity/dashboardProps";
import { isSanityConfigured } from "@/lib/sanity/client";

export const metadata = {
    title: "Dashboard — Velorra Admin",
    description: "Velorra Fashion store overview",
};

// always read fresh, so the dashboard reflects its own writes immediately
export const dynamic = "force-dynamic";

/**
 * The store dashboard.
 *
 * This is the template's "Dashboard 03" layout, which the owner picked, with
 * every widget rewired to real Sanity data. The template drove all of it from a
 * fixtures file — invented revenue, growth percentages and sparklines — which is
 * fine for a demo but dangerous on a screen someone runs a real shop from.
 *
 * Two of the original widgets are gone rather than faked: "Website Visitors"
 * and the visitor location map both need web analytics this store does not
 * collect. The donut that showed fabricated traffic sources now shows real
 * order statuses, and the invented comments list is now real low-stock alerts.
 */
export default async function DashboardPage() {
    if (!isSanityConfigured) {
        return (
            <Layout>
                <EmptyState
                    title="Dashboard unavailable"
                    message="Sanity is not configured. Add NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN to .env.local."
                />
            </Layout>
        );
    }

    try {
        const data = await getDashboardData();

        const statCards = buildStatCards(data);
        const revenueData = buildRevenueChartData(data);
        const statusDonut = buildOrderStatusDonut(data);
        const recentOrders = buildRecentOrders(data);

        const topCustomers = data.topCustomers.map((c, i) => ({
            id: c.email || i,
            name: c.name,
            purchases: c.purchases,
            total: formatPkr(c.total),
            image: `/images/customers/customer-${(i % 4) + 1}.jpg`,
        }));

        return (
            <Layout>
                <div className="tf-section-2 mb-30">
                    {statCards.map((card, idx) => (
                        <StartsCard2 key={idx} card={card} />
                    ))}
                </div>

                <div className="tf-section-1 mb-30">
                    <RevenueChart3 revenueData={revenueData} />
                    <div className="flex gap20 flex-wrap-mobile">
                        {data.statusCounts.length > 0 ? (
                            <TrafficSources trafficSourceData={statusDonut} />
                        ) : (
                            <div className="wg-box w-half">
                                <h5>Orders by status</h5>
                                <div
                                    className="body-text"
                                    style={{ padding: "40px 0", textAlign: "center", opacity: 0.7 }}
                                >
                                    No orders yet.
                                </div>
                            </div>
                        )}
                        <TopCustomers
                            customers={topCustomers}
                            emptyMessage="No customers yet — they'll appear here after the first order."
                        />
                    </div>
                </div>

                <div className="tf-section-1">
                    {recentOrders.length > 0 ? (
                        <RecentOrder2 recentOrders={recentOrders} />
                    ) : (
                        <div className="wg-box">
                            <h5>Recent orders</h5>
                            <div
                                className="body-text"
                                style={{ padding: "40px 0", textAlign: "center", opacity: 0.7 }}
                            >
                                Orders placed through the storefront will appear here.
                            </div>
                        </div>
                    )}
                    <LowStockProducts items={data.lowStock} />
                </div>
            </Layout>
        );
    } catch (error) {
        console.error("DASHBOARD_LOAD_ERROR", error);
        return (
            <Layout>
                <EmptyState
                    title="Dashboard unavailable"
                    message="Could not load dashboard data from Sanity. Check SANITY_API_TOKEN in .env.local."
                />
            </Layout>
        );
    }
}
