import "server-only";
import type { DashboardData } from "./analytics";
import { formatPkr } from "./analytics";
import type { Product } from "@/types/models";

/**
 * Adapts real dashboard data into the exact prop shapes the template's widgets
 * expect, so the template markup and styling survive untouched while the
 * numbers underneath become real.
 *
 * Percentage deltas are computed from the series themselves (first vs last
 * bucket) rather than being supplied — no invented "+1.56%" anywhere.
 */

const PLACEHOLDER_IMAGE = "/images/products/1.png";

/** Percent change between the first and last non-trivial buckets of a series. */
function trend(series: number[]): string {
    if (series.length < 2) return "0%";
    const first = series[0];
    const last = series[series.length - 1];
    if (first === 0) return last === 0 ? "0%" : "100%";
    return `${Math.abs(((last - first) / first) * 100).toFixed(2)}%`;
}

export type StatCard = {
    title: string;
    chartColor: string;
    color: string;
    chartHeight: number;
    defaultPeriod: string;
    chartData: Record<string, { value: string | number; series: number[] }>;
};

/** The four headline cards across the top of the dashboard. */
export function buildStatCards(data: DashboardData): StatCard[] {
    const { totals, revenueSeries, ordersSeries, customersSeries } = data;

    // Products has no time dimension in the data model (we don't track stock
    // history), so its "series" is a flat line at the current count — honest,
    // and it renders as a steady bar rather than a fake trend.
    const flat = (n: number) => new Array(12).fill(n);

    return [
        {
            title: "Revenue",
            chartColor: "#BFDBFE",
            color: "#2377FC",
            chartHeight: 194,
            defaultPeriod: "Monthly",
            chartData: revenueSeries,
        },
        {
            title: "Orders",
            chartColor: "#BBF7D0",
            color: "#22C55E",
            chartHeight: 194,
            defaultPeriod: "Monthly",
            chartData: ordersSeries,
        },
        {
            title: "Customers",
            chartColor: "#FDE68A",
            color: "#F59E0B",
            chartHeight: 194,
            defaultPeriod: "Monthly",
            chartData: customersSeries,
        },
        {
            title: "Products",
            chartColor: "#DDD6FE",
            color: "#8B5CF6",
            chartHeight: 194,
            defaultPeriod: "Monthly",
            chartData: {
                Monthly: { value: String(totals.products), series: flat(totals.products) },
            },
        },
    ];
}

export type RevenueChartItem = {
    revenueLabel: string;
    revenueValue: string;
    revenueTrend: string;
    orderLabel: string;
    orderValue: string;
    orderTrend: string;
    categories: string[];
    revenueSeries: number[];
    orderSeries: number[];
};

export type RevenueChartData = {
    Weekly: RevenueChartItem;
    Monthly: RevenueChartItem;
    Yearly: RevenueChartItem;
};

export function buildRevenueChartData(data: DashboardData): RevenueChartData {
    const { revenueSeries, ordersSeries, revenueByMonth } = data;

    const item = (
        revenue: number[],
        orders: number[],
        categories: string[]
    ): RevenueChartItem => ({
        revenueLabel: "Revenue",
        revenueValue: formatPkr(revenue.reduce((n, x) => n + x, 0)),
        revenueTrend: trend(revenue),
        orderLabel: "Orders",
        orderValue: String(orders.reduce((n, x) => n + x, 0)),
        orderTrend: trend(orders),
        categories,
        revenueSeries: revenue,
        orderSeries: orders,
    });

    // last 7 days
    const weeklyRevenue = revenueSeries.Daily.series.slice(-7);
    const weeklyOrders = ordersSeries.Daily.series.slice(-7);
    const dayLabels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString("en-GB", { weekday: "short" });
    });

    // last 12 weeks
    const weekLabels = Array.from({ length: 12 }, (_, i) => `W${i + 1}`);

    return {
        Weekly: item(weeklyRevenue, weeklyOrders, dayLabels),
        Monthly: item(
            revenueSeries.Weekly.series,
            ordersSeries.Weekly.series,
            weekLabels
        ),
        Yearly: item(
            revenueByMonth.map((m) => m.revenue),
            revenueByMonth.map((m) => m.orders),
            revenueByMonth.map((m) => m.label)
        ),
    };
}

type DonutItem = {
    key: string;
    title: string;
    pct: number;
    color: string;
    valueText: string;
    deltaText: string;
};

export type DonutData = {
    title: string;
    defaultPeriod: string;
    periods: string[];
    visitors: { value: string; percent: string; trending: string };
    Weekly: DonutItem[];
    Monthly: DonutItem[];
    Yearly: DonutItem[];
};

const STATUS_COLORS: Record<string, string> = {
    pending: "#F59E0B",
    confirmed: "#2377FC",
    shipped: "#8B5CF6",
    delivered: "#22C55E",
    cancelled: "#EF4444",
};

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Feeds the template's donut with real order-status counts.
 *
 * That component was built for fabricated "traffic sources" (Organic Search,
 * Referrals…) which this store has no way to measure. Order status is real,
 * fits the same shape, and is something the owner actually acts on.
 *
 * The period tabs are kept because the component renders them, but the counts
 * are identical across all three — status is a current state, not a time
 * series, and inventing per-period variation would be exactly the problem
 * being fixed here.
 */
export function buildOrderStatusDonut(data: DashboardData): DonutData {
    const total = data.statusCounts.reduce((n, s) => n + s.count, 0);

    const items: DonutItem[] = data.statusCounts.map((s) => ({
        key: s.status,
        title: titleCase(s.status),
        pct: total === 0 ? 0 : Math.round((s.count / total) * 100),
        color: STATUS_COLORS[s.status] ?? "#94A3B8",
        valueText: String(s.count),
        deltaText: total === 0 ? "0%" : `${Math.round((s.count / total) * 100)}%`,
    }));

    return {
        title: "Orders by status",
        defaultPeriod: "Weekly",
        periods: ["Weekly", "Monthly", "Yearly"],
        visitors: { value: String(total), percent: "", trending: "up" },
        Weekly: items,
        Monthly: items,
        Yearly: items,
    };
}

/** Recent orders mapped into the template's row shape. */
export function buildRecentOrders(data: DashboardData): Product[] {
    return data.recentOrders.map((o) => ({
        id: o._id,
        productId: o.orderNumber,
        name: o.lines?.[0]?.title ?? "Order",
        image: o.lines?.[0]?.image || PLACEHOLDER_IMAGE,
        price: formatPkr(o.total ?? 0),
        quantity: String((o.lines ?? []).reduce((n, l) => n + (l.qty ?? 0), 0)),
        customer: o.customerName ?? "Guest",
        status: o.status,
    }));
}
