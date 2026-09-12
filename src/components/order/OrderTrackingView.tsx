import Image from "next/image";
import Link from "next/link";
import type { Order } from "@/lib/sanity/orders";

/**
 * Order progress, derived from the order's status.
 *
 * The template version rendered a fabricated courier log — timestamped events
 * at invented US addresses ("The carrier is picking up the goods", "4140 Parker
 * Rd. Allentown, New Mexico"). There is no courier integration behind this
 * store, so no per-event history can be real. What IS real is where the order
 * has reached in its own lifecycle, which is what this shows.
 */

const STEPS = [
    { key: "pending", title: "Order received", note: "Awaiting confirmation" },
    { key: "confirmed", title: "Order confirmed", note: "Being prepared" },
    { key: "shipped", title: "Shipped", note: "On its way" },
    { key: "delivered", title: "Delivered", note: "Complete" },
] as const;

const money = (n: number | null | undefined) => `Rs ${Math.round(n ?? 0).toLocaleString("en-PK")}`;

export default function OrderTrackingView({ order }: { order: Order }) {
    const cancelled = order.status === "cancelled";
    const reachedIndex = STEPS.findIndex((s) => s.key === order.status);
    const itemCount = (order.lines ?? []).reduce((n, l) => n + (l.qty ?? 0), 0);
    const firstLine = order.lines?.[0];

    return (
        <div className="tf-section-1">
            <div className="wg-box">
                <div className="flex gap20 flex-wrap-mobile">
                    <div style={{ flex: "0 0 auto" }}>
                        <Image
                            width={180}
                            height={180}
                            src={firstLine?.image || "/images/products/1.png"}
                            alt={firstLine?.title ?? "Order"}
                            style={{ objectFit: "cover", borderRadius: 12 }}
                            unoptimized
                        />
                    </div>
                    <div className="flex-grow">
                        <div className="h5 mb-20">{firstLine?.title ?? "Order"}</div>
                        <div className="flex justify-between mb-14">
                            <div className="body-text">Order number</div>
                            <div className="body-title-2">{order.orderNumber}</div>
                        </div>
                        <div className="flex justify-between mb-14">
                            <div className="body-text">Placed</div>
                            <div className="body-title-2">
                                {order.createdAt
                                    ? new Date(order.createdAt).toLocaleDateString("en-GB", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                      })
                                    : "—"}
                            </div>
                        </div>
                        <div className="flex justify-between mb-14">
                            <div className="body-text">Items</div>
                            <div className="body-title-2">{itemCount}</div>
                        </div>
                        <div className="flex justify-between mb-14">
                            <div className="body-text">Total</div>
                            <div className="body-title-2">{money(order.total)}</div>
                        </div>
                        <Link className="tf-button style-1" href={`/order-detail?id=${order._id}`}>
                            View full order
                        </Link>
                    </div>
                </div>
            </div>

            <div className="wg-box">
                <h5 className="mb-20">Progress</h5>

                {cancelled ? (
                    <div className="body-text" style={{ color: "#EF4444", padding: "16px 0" }}>
                        This order was cancelled.
                    </div>
                ) : (
                    <ul className="flex flex-column gap20">
                        {STEPS.map((step, index) => {
                            const done = index <= reachedIndex;
                            const current = index === reachedIndex;
                            return (
                                <li key={step.key} className="flex items-center gap14">
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            width: 14,
                                            height: 14,
                                            borderRadius: "50%",
                                            flex: "0 0 auto",
                                            background: done ? "#22C55E" : "transparent",
                                            border: done ? "none" : "2px solid rgba(0,0,0,.25)",
                                        }}
                                    />
                                    <div>
                                        <div
                                            className="body-title-2"
                                            style={{ opacity: done ? 1 : 0.55 }}
                                        >
                                            {step.title}
                                        </div>
                                        <div className="text-tiny">
                                            {current ? step.note : done ? "Done" : "Pending"}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                <div className="body-text mt-20" style={{ opacity: 0.7, fontSize: 13 }}>
                    Progress reflects the order status set in the dashboard. Courier-level
                    tracking would need a shipping provider integration.
                </div>
            </div>
        </div>
    );
}
