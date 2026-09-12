import Link from "next/link";
import { formatPkr } from "@/lib/sanity/analytics";

export type OrderHistoryRow = {
    id: string;
    orderNumber: string;
    customer: string;
    email: string;
    date: string;
    total: number;
    status: string;
};

const STATUS_COLORS: Record<string, string> = {
    pending: "#F59E0B",
    confirmed: "#2377FC",
    shipped: "#8B5CF6",
    delivered: "#22C55E",
    cancelled: "#EF4444",
};

/**
 * Full order history.
 *
 * Replaces the template's "Transfer history" table, which was a hardcoded list
 * of invented people and dollar amounts with a delete button that only removed
 * rows from local state — it never touched any store.
 */
export default function OrderHistory({ rows }: { rows: OrderHistoryRow[] }) {
    return (
        <div className="wg-box">
            <div className="flex items-center justify-between">
                <h5>Order history</h5>
                <Link href="/order-list" className="text-tiny">
                    Manage orders
                </Link>
            </div>

            {rows.length === 0 ? (
                <div className="body-text" style={{ padding: "40px 0", textAlign: "center", opacity: 0.7 }}>
                    No orders yet. Orders placed on the storefront appear here.
                </div>
            ) : (
                <div className="wg-table table-all-user">
                    <ul className="table-title flex gap20 mb-14">
                        <li>
                            <div className="body-title">Order</div>
                        </li>
                        <li>
                            <div className="body-title">Customer</div>
                        </li>
                        <li>
                            <div className="body-title">Date</div>
                        </li>
                        <li>
                            <div className="body-title">Total</div>
                        </li>
                        <li>
                            <div className="body-title">Status</div>
                        </li>
                    </ul>
                    <ul className="flex flex-column">
                        {rows.map((row) => (
                            <li key={row.id} className="wg-product item-row gap20">
                                <div className="body-text">
                                    <Link href={`/order-detail?id=${row.id}`}>{row.orderNumber}</Link>
                                </div>
                                <div className="body-text">
                                    {row.customer}
                                    {row.email && <div className="text-tiny">{row.email}</div>}
                                </div>
                                <div className="body-text">{row.date}</div>
                                <div className="body-text">{formatPkr(row.total)}</div>
                                <div
                                    className="body-title-2"
                                    style={{ color: STATUS_COLORS[row.status] ?? "#94A3B8" }}
                                >
                                    {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
