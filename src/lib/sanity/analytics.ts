import "server-only";
import { adminClient, catalogClient } from "./client";

/**
 * Dashboard analytics, computed from real orders.
 *
 * The template's dashboard rendered invented figures from a fixtures file —
 * revenue, growth percentages, sparklines, all fabricated. Everything here is
 * derived from documents that actually exist, so a number on the dashboard is
 * always a number the store really has. Where no data source exists at all
 * (web traffic, visitor geography, product reviews) nothing is invented; the
 * page shows an explicit "not connected" state instead.
 */

export type Period = "Daily" | "Weekly" | "Monthly";

export type SeriesByPeriod = Record<Period, { value: string; series: number[] }>;

export type TopCustomer = {
    name: string;
    email: string;
    purchases: number;
    total: number;
};

type OrderRow = {
    _id: string;
    orderNumber: string;
    status: string;
    customerName: string | null;
    customerEmail: string | null;
    total: number | null;
    createdAt: string | null;
    lines:
        | { productId: string | null; title: string | null; image: string | null; qty: number | null; unitPrice: number | null }[]
        | null;
};

export type DashboardData = {
    totals: {
        products: number;
        outOfStock: number;
        orders: number;
        pendingOrders: number;
        revenue: number;
        customers: number;
    };
    revenueSeries: SeriesByPeriod;
    ordersSeries: SeriesByPeriod;
    customersSeries: SeriesByPeriod;
    /** Revenue for the big chart, bucketed by month across the last 12 months. */
    revenueByMonth: { label: string; revenue: number; orders: number }[];
    topCustomers: TopCustomer[];
    recentOrders: OrderRow[];
    /** Order counts per status — real data for the donut the template used for fake traffic. */
    statusCounts: { status: string; count: number }[];
    /** Best sellers by units, aggregated from order lines. */
    topProducts: { productId: string; title: string; image: string | null; units: number; revenue: number }[];
    /** Products at or below the low-stock threshold, most urgent first. */
    lowStock: { _id: string; title: string; stock: number; image: string | null; category: string | null }[];
    /** True when there are no orders at all — widgets should show empty states. */
    isEmpty: boolean;
};

/** Stock at or below this is surfaced on the dashboard as needing attention. */
export const LOW_STOCK_THRESHOLD = 5;

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Buckets values into `count` consecutive windows ending now. */
function bucket(
    orders: OrderRow[],
    count: number,
    msPerBucket: number,
    value: (o: OrderRow) => number,
    now: number
): number[] {
    const buckets = new Array(count).fill(0);
    for (const o of orders) {
        if (!o.createdAt) continue;
        const t = new Date(o.createdAt).getTime();
        if (Number.isNaN(t)) continue;
        const age = now - t;
        if (age < 0 || age >= count * msPerBucket) continue;
        // index 0 is the oldest bucket in the window, so the series reads left-to-right
        const idx = count - 1 - Math.floor(age / msPerBucket);
        buckets[idx] += value(o);
    }
    return buckets;
}

/** Same bucketing, but counting distinct first-time customers per window. */
function bucketNewCustomers(orders: OrderRow[], count: number, msPerBucket: number, now: number): number[] {
    const firstSeen = new Map<string, number>();
    for (const o of orders) {
        if (!o.customerEmail || !o.createdAt) continue;
        const t = new Date(o.createdAt).getTime();
        if (Number.isNaN(t)) continue;
        const prev = firstSeen.get(o.customerEmail);
        if (prev == null || t < prev) firstSeen.set(o.customerEmail, t);
    }
    const buckets = new Array(count).fill(0);
    for (const t of firstSeen.values()) {
        const age = now - t;
        if (age < 0 || age >= count * msPerBucket) continue;
        buckets[count - 1 - Math.floor(age / msPerBucket)] += 1;
    }
    return buckets;
}

const DAY = 24 * 60 * 60 * 1000;

function buildSeries(
    orders: OrderRow[],
    value: (o: OrderRow) => number,
    now: number,
    format: (n: number) => string
): SeriesByPeriod {
    const daily = bucket(orders, 30, DAY, value, now);
    const weekly = bucket(orders, 12, 7 * DAY, value, now);
    const monthly = bucket(orders, 12, 30 * DAY, value, now);
    const sum = (a: number[]) => a.reduce((n, x) => n + x, 0);
    return {
        Daily: { value: format(sum(daily)), series: daily },
        Weekly: { value: format(sum(weekly)), series: weekly },
        Monthly: { value: format(sum(monthly)), series: monthly },
    };
}

function buildCustomerSeries(orders: OrderRow[], now: number): SeriesByPeriod {
    const daily = bucketNewCustomers(orders, 30, DAY, now);
    const weekly = bucketNewCustomers(orders, 12, 7 * DAY, now);
    const monthly = bucketNewCustomers(orders, 12, 30 * DAY, now);
    const sum = (a: number[]) => a.reduce((n, x) => n + x, 0);
    return {
        Daily: { value: String(sum(daily)), series: daily },
        Weekly: { value: String(sum(weekly)), series: weekly },
        Monthly: { value: String(sum(monthly)), series: monthly },
    };
}

export const formatPkr = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

export async function getDashboardData(): Promise<DashboardData> {
    const [orders, productTotals] = await Promise.all([
        adminClient().fetch<OrderRow[]>(`
            *[_type == "order"] | order(createdAt desc) {
                _id, orderNumber, status, customerName, customerEmail, total, createdAt,
                lines[]{ productId, title, image, qty, unitPrice }
            }
        `),
        catalogClient().fetch<{
            products: number;
            outOfStock: number;
            lowStock: DashboardData["lowStock"];
        }>(
            `{
                "products": count(*[_type == "product"]),
                "outOfStock": count(*[_type == "product" && (!defined(stock) || stock <= 0)]),
                "lowStock": *[_type == "product" && (!defined(stock) || stock <= $threshold)]
                    | order(coalesce(stock, 0) asc)[0...6] {
                        _id, title, "stock": coalesce(stock, 0),
                        "image": images[0].asset->url,
                        "category": category->name
                    }
            }`,
            { threshold: LOW_STOCK_THRESHOLD }
        ),
    ]);

    const all = orders ?? [];
    // cancelled orders are still records, but they are not money the store made
    const billable = all.filter((o) => o.status !== "cancelled");
    const now = Date.now();

    const revenue = billable.reduce((n, o) => n + (o.total ?? 0), 0);
    const customers = new Set(all.map((o) => o.customerEmail).filter(Boolean)).size;

    // top customers by lifetime spend
    const byCustomer = new Map<string, TopCustomer>();
    for (const o of billable) {
        if (!o.customerEmail) continue;
        const existing = byCustomer.get(o.customerEmail);
        if (existing) {
            existing.purchases += 1;
            existing.total += o.total ?? 0;
        } else {
            byCustomer.set(o.customerEmail, {
                name: o.customerName ?? "Guest",
                email: o.customerEmail,
                purchases: 1,
                total: o.total ?? 0,
            });
        }
    }
    const topCustomers = [...byCustomer.values()].sort((a, b) => b.total - a.total).slice(0, 5);

    // best sellers, aggregated across every line of every non-cancelled order
    const byProduct = new Map<string, DashboardData["topProducts"][number]>();
    for (const o of billable) {
        for (const line of o.lines ?? []) {
            const id = line.productId || line.title || "unknown";
            const units = line.qty ?? 0;
            const revenueForLine = (line.unitPrice ?? 0) * units;
            const existing = byProduct.get(id);
            if (existing) {
                existing.units += units;
                existing.revenue += revenueForLine;
            } else {
                byProduct.set(id, {
                    productId: line.productId ?? id,
                    title: line.title ?? "Unknown product",
                    image: line.image ?? null,
                    units,
                    revenue: revenueForLine,
                });
            }
        }
    }
    const topProducts = [...byProduct.values()].sort((a, b) => b.units - a.units).slice(0, 6);

    // last 12 calendar months for the revenue chart
    const revenueByMonth: { label: string; revenue: number; orders: number }[] = [];
    const cursor = new Date();
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);
    for (let i = 11; i >= 0; i--) {
        const start = new Date(cursor);
        start.setMonth(start.getMonth() - i);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        const inMonth = billable.filter((o) => {
            if (!o.createdAt) return false;
            const t = new Date(o.createdAt).getTime();
            return t >= start.getTime() && t < end.getTime();
        });
        revenueByMonth.push({
            label: MONTH_LABELS[start.getMonth()],
            revenue: inMonth.reduce((n, o) => n + (o.total ?? 0), 0),
            orders: inMonth.length,
        });
    }

    return {
        totals: {
            products: productTotals?.products ?? 0,
            outOfStock: productTotals?.outOfStock ?? 0,
            orders: all.length,
            pendingOrders: all.filter((o) => o.status === "pending").length,
            revenue,
            customers,
        },
        revenueSeries: buildSeries(billable, (o) => o.total ?? 0, now, formatPkr),
        ordersSeries: buildSeries(all, () => 1, now, (n) => String(n)),
        customersSeries: buildCustomerSeries(all, now),
        revenueByMonth,
        topCustomers,
        recentOrders: all.slice(0, 8),
        statusCounts: ORDER_STATUSES.map((status) => ({
            status,
            count: all.filter((o) => o.status === status).length,
        })).filter((s) => s.count > 0),
        topProducts,
        lowStock: productTotals?.lowStock ?? [],
        isEmpty: all.length === 0,
    };
}
