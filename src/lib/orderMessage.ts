/**
 * Order confirmation text, shared by the email body and the WhatsApp links.
 *
 * Kept free of server-only imports so the storefront-facing shapes and the
 * admin UI can both build the same message.
 *
 * Note on WhatsApp: sending a message *automatically* requires the WhatsApp
 * Business API (Meta approval plus a provider such as Twilio). What works today
 * with no integration is a click-to-chat link with the text pre-filled — one tap
 * for the customer to send, one for the owner to reply. That is what these
 * builders produce.
 */

export type ConfirmationLine = {
    title: string | null;
    qty: number | null;
    unitPrice: number | null;
    size?: string | null;
};

export type ConfirmationOrder = {
    orderNumber: string;
    customerName?: string | null;
    lines: ConfirmationLine[];
    subtotal?: number | null;
    discount?: number | null;
    shippingCost?: number | null;
    total: number | null;
    paymentMethod?: string | null;
};

const money = (n: number | null | undefined) => `Rs ${Math.round(n ?? 0).toLocaleString("en-PK")}`;

const paymentLabel = (method: string | null | undefined) =>
    method === "bank" ? "Bank transfer" : method === "card" ? "Card" : "Cash on delivery";

/** Plain-text summary used in the email body and both WhatsApp links. */
export function orderSummaryText(order: ConfirmationOrder): string {
    const items = order.lines
        .map((l) => {
            const size = l.size ? ` (size ${l.size})` : "";
            return `• ${l.title}${size} × ${l.qty} — ${money((l.unitPrice ?? 0) * (l.qty ?? 0))}`;
        })
        .join("\n");

    const rows = [
        order.subtotal != null ? `Subtotal: ${money(order.subtotal)}` : null,
        order.discount ? `Discount: −${money(order.discount)}` : null,
        order.shippingCost ? `Shipping: ${money(order.shippingCost)}` : "Shipping: Free",
        `Total: ${money(order.total)}`,
        `Payment: ${paymentLabel(order.paymentMethod)}`,
    ].filter(Boolean);

    return [`Order ${order.orderNumber}`, "", items, "", ...rows].join("\n");
}

/** What the customer sends to the store from the confirmation screen. */
export function customerWhatsAppText(order: ConfirmationOrder, storeName: string): string {
    return [
        `Hi ${storeName}, I've just placed order ${order.orderNumber}.`,
        "",
        orderSummaryText(order),
        "",
        "Please confirm delivery. Thank you!",
    ].join("\n");
}

/** What the owner sends to the customer from the dashboard. */
export function ownerWhatsAppText(order: ConfirmationOrder, storeName: string): string {
    const name = order.customerName ? ` ${order.customerName}` : "";
    return [
        `Hi${name}, thank you for your order with ${storeName}.`,
        "",
        orderSummaryText(order),
        "",
        "We're preparing it now and will confirm your delivery date shortly.",
    ].join("\n");
}

/** Builds a wa.me link, or null when the number is unusable. */
export function whatsAppLink(phone: string | null | undefined, text: string): string | null {
    const digits = (phone ?? "").replace(/[^0-9]/g, "");
    if (digits.length < 8) return null;
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
