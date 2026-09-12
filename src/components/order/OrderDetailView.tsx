"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Order, OrderStatus } from "@/lib/sanity/orders";
import { ownerWhatsAppText, whatsAppLink } from "@/lib/orderMessage";

/**
 * Real order detail.
 *
 * The template version rendered a fixture: a hardcoded US shipping address, a
 * fixed "20 Nov 2023" delivery date, invented $10 shipping and $5 tax, and no
 * way to actually change the order. Everything here comes from the order
 * document, and the status control writes back through /api/orders.
 */

const STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const STATUS_COLORS: Record<string, string> = {
    pending: "#F59E0B",
    confirmed: "#2377FC",
    shipped: "#8B5CF6",
    delivered: "#22C55E",
    cancelled: "#EF4444",
};

const money = (n: number | null | undefined) => `Rs ${Math.round(n ?? 0).toLocaleString("en-PK")}`;

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function formatAddress(address: Record<string, string> | null): string[] {
    if (!address) return [];
    const { line1, line2, city, state, postcode, country } = address;
    return [line1, line2, [city, state].filter(Boolean).join(", "), postcode, country]
        .map((v) => (v ?? "").trim())
        .filter(Boolean);
}

export default function OrderDetailView({
    order,
    storeName = "Velorra Fashion",
}: {
    order: Order;
    storeName?: string;
}) {
    const router = useRouter();
    const [status, setStatus] = useState<OrderStatus>(order.status);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    async function updateStatus(next: OrderStatus) {
        const previous = status;
        setStatus(next);
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            const res = await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: order._id, status: next }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Could not update the order");
            setSaved(true);
            router.refresh();
        } catch (err) {
            setStatus(previous); // roll back so the UI never claims a change that failed
            setError(err instanceof Error ? err.message : "Could not update the order");
        } finally {
            setSaving(false);
        }
    }

    // Click-to-chat with the confirmation pre-written. Automated sending needs
    // the WhatsApp Business API; this needs nothing and reaches the customer on
    // the channel the store actually runs on.
    const whatsappUrl = whatsAppLink(order.customerPhone, ownerWhatsAppText(order, storeName));

    const addressLines = formatAddress(order.shippingAddress);
    const itemCount = (order.lines ?? []).reduce((n, l) => n + (l.qty ?? 0), 0);

    return (
        <div className="tf-section-1">
            <div className="wg-box">
                <div className="flex items-center justify-between flex-wrap gap10">
                    <div>
                        <h5 className="mb-3">{order.orderNumber}</h5>
                        <div className="text-tiny">
                            Placed{" "}
                            {order.createdAt
                                ? new Date(order.createdAt).toLocaleString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                  })
                                : "—"}
                        </div>
                    </div>
                    <div
                        className="body-title-2"
                        style={{ color: STATUS_COLORS[status] ?? "#94A3B8" }}
                    >
                        {titleCase(status)}
                    </div>
                </div>

                <ul className="flex flex-column mt-20">
                    {(order.lines ?? []).map((line, i) => (
                        <li className="wg-product item-row gap20" key={`${line.productId}-${i}`}>
                            <div className="name flex-grow">
                                <div className="image no-bg">
                                    <Image
                                        src={line.image || "/images/products/1.png"}
                                        alt={line.title ?? "Product"}
                                        width={50}
                                        height={50}
                                        style={{ objectFit: "cover" }}
                                        unoptimized
                                    />
                                </div>
                                <div>
                                    <div className="title">
                                        <Link
                                            href={`/edit-product?id=${line.productId}`}
                                            className="body-text"
                                        >
                                            {line.title}
                                        </Link>
                                    </div>
                                    <div className="text-tiny">
                                        {[line.size && `Size ${line.size}`, line.color && "Colour"]
                                            .filter(Boolean)
                                            .join(" · ") || "—"}
                                    </div>
                                </div>
                            </div>
                            <div className="body-text">× {line.qty}</div>
                            <div className="body-text">{money(line.unitPrice)}</div>
                            <div className="body-title-2">
                                {money((line.unitPrice ?? 0) * (line.qty ?? 0))}
                            </div>
                        </li>
                    ))}
                </ul>

                <div className="flex flex-column gap10 mt-20">
                    <div className="flex justify-between">
                        <div className="body-text">Subtotal ({itemCount} items)</div>
                        <div className="body-text">{money(order.subtotal)}</div>
                    </div>
                    <div className="flex justify-between">
                        <div className="body-text">Shipping</div>
                        <div className="body-text">
                            {order.shippingCost ? money(order.shippingCost) : "Free"}
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <div className="body-title">Total</div>
                        <div className="body-title-2 tf-color-1">{money(order.total)}</div>
                    </div>
                </div>
            </div>

            <div className="flex flex-column gap20">
                <div className="wg-box gap10">
                    <div className="body-title">Status</div>
                    {error && (
                        <div className="body-text" style={{ color: "#e53e3e" }}>
                            {error}
                        </div>
                    )}
                    {saved && !error && (
                        <div className="body-text" style={{ color: "#0f993e" }}>
                            Status updated.
                        </div>
                    )}
                    <select
                        value={status}
                        disabled={saving}
                        onChange={(e) => updateStatus(e.target.value as OrderStatus)}
                    >
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {titleCase(s)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="wg-box gap10">
                    <div className="body-title">Customer</div>
                    <div className="body-text">{order.customerName ?? "Guest"}</div>
                    {order.customerEmail && (
                        <a className="body-text" href={`mailto:${order.customerEmail}`}>
                            {order.customerEmail}
                        </a>
                    )}
                    {order.customerPhone && (
                        <a className="body-text" href={`tel:${order.customerPhone}`}>
                            {order.customerPhone}
                        </a>
                    )}
                    {whatsappUrl ? (
                        <a
                            className="tf-button w-full mt-10"
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ background: "#25D366" }}
                        >
                            Message on WhatsApp
                        </a>
                    ) : (
                        <div className="text-tiny" style={{ opacity: 0.7 }}>
                            No usable phone number on this order.
                        </div>
                    )}
                </div>

                <div className="wg-box gap10">
                    <div className="body-title">Shipping address</div>
                    {addressLines.length > 0 ? (
                        addressLines.map((line, i) => (
                            <div className="body-text" key={i}>
                                {line}
                            </div>
                        ))
                    ) : (
                        <div className="body-text" style={{ opacity: 0.7 }}>
                            No address on this order.
                        </div>
                    )}
                </div>

                <div className="wg-box gap10">
                    <div className="body-title">Payment method</div>
                    <div className="body-text">
                        {order.paymentMethod === "cod"
                            ? "Cash on delivery"
                            : order.paymentMethod === "bank"
                              ? "Bank transfer"
                              : order.paymentMethod === "card"
                                ? "Card"
                                : "—"}
                    </div>
                </div>

                {order.notes && (
                    <div className="wg-box gap10">
                        <div className="body-title">Order notes</div>
                        <div className="body-text">{order.notes}</div>
                    </div>
                )}

                <Link className="tf-button style-1 w-full" href={`/order-tracking?id=${order._id}`}>
                    <i className="icon-truck"></i>
                    Track order
                </Link>
            </div>
        </div>
    );
}
