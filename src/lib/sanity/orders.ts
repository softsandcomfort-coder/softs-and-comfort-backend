import "server-only";
import { adminClient } from "./client";
import { decrementStock, restoreStock } from "./stock";

/**
 * Orders live in the PRIVATE `admin` dataset — they carry customer names,
 * emails, phone numbers and addresses, which must never be readable from the
 * public catalogue dataset the storefront queries.
 */

export type OrderLine = {
    productId: string;
    title: string;
    image: string | null;
    unitPrice: number;
    qty: number;
    size: string | null;
    color: string | null;
};

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export type Order = {
    _id: string;
    orderNumber: string;
    status: OrderStatus;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    shippingAddress: Record<string, string> | null;
    notes: string | null;
    lines: OrderLine[];
    subtotal: number;
    shippingCost: number;
    /** Promo discount applied, in PKR. */
    discount: number;
    /** The code that produced it, kept for the record. */
    promoCode: string | null;
    total: number;
    paymentMethod: string | null;
    createdAt: string;
    /** True while this order is holding stock (confirmed / shipped / delivered). */
    stockApplied?: boolean;
};

const ORDER_PROJECTION = `{
    _id, orderNumber, status,
    customerName, customerEmail, customerPhone,
    shippingAddress, notes,
    lines[]{ productId, title, image, unitPrice, qty, size, color },
    subtotal, shippingCost, "discount": coalesce(discount, 0), promoCode, stockApplied,
    total, paymentMethod, createdAt
}`;

export async function listOrders(): Promise<Order[]> {
    return adminClient().fetch(`*[_type == "order"] | order(createdAt desc) ${ORDER_PROJECTION}`);
}

export async function getOrder(id: string): Promise<Order | null> {
    return adminClient().fetch(`*[_type == "order" && _id == $id][0] ${ORDER_PROJECTION}`, { id });
}

/** Statuses that hold stock: the goods are committed to this customer. */
const HOLDS_STOCK: OrderStatus[] = ["confirmed", "shipped", "delivered"];

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    // The stock movement depends on what the status was, so read it first.
    const before = await getOrder(id);
    if (!before) throw new Error("Order not found");
    if (before.status === status) return;

    const lines = (before.lines ?? []).map((l) => ({ productId: l.productId, qty: l.qty }));
    const applied = before.stockApplied === true;
    const shouldHold = HOLDS_STOCK.includes(status);

    // `stockApplied` records whether this order is currently holding stock, so
    // a status moved back and forth cannot double-count in either direction.
    let nextApplied = applied;
    try {
        if (shouldHold && !applied) {
            await decrementStock(lines);
            nextApplied = true;
        } else if (!shouldHold && applied) {
            // back to pending, or cancelled — the goods return to the shelf
            await restoreStock(lines);
            nextApplied = false;
        }
    } catch (error) {
        console.error("STOCK_ADJUST_ON_STATUS_ERROR", id, error);
    }

    await adminClient().patch(id).set({ status, stockApplied: nextApplied }).commit();
}

/**
 * How many orders this phone number has placed since `since`.
 *
 * The in-process rate limiter cannot see other serverless instances, so this
 * is the durable half of the flood protection: whichever instance handles the
 * request, the count comes from the same dataset.
 */
export async function countRecentOrdersByPhone(phone: string, since: Date): Promise<number> {
    return adminClient().fetch<number>(
        `count(*[_type == "order" && customerPhone == $phone && createdAt >= $since])`,
        { phone, since: since.toISOString() }
    );
}

export async function deleteOrder(id: string): Promise<void> {
    await adminClient().delete(id);
}

/** SC-YYMMDD-XXXX — readable, sortable, and unique enough for a small store. */
function generateOrderNumber(): string {
    const now = new Date();
    const stamp = [
        String(now.getFullYear()).slice(2),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
    ].join("");
    const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    return `SC-${stamp}-${random}`;
}

export type CreateOrderInput = {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    shippingAddress?: Record<string, string>;
    notes?: string;
    lines: OrderLine[];
    shippingCost?: number;
    /** Already validated and computed server-side by validatePromoCode. */
    discount?: number;
    promoCode?: string | null;
    paymentMethod?: string;
};

export async function createOrder(input: CreateOrderInput): Promise<Order> {
    // Totals are recomputed here rather than trusted from the request body —
    // a client-supplied total is a client-supplied discount.
    const subtotal = input.lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
    const shippingCost = input.shippingCost ?? 0;
    // clamped so a discount can never exceed the goods or make the total negative
    const discount = Math.max(0, Math.min(input.discount ?? 0, subtotal));

    const doc = await adminClient().create({
        _type: "order",
        orderNumber: generateOrderNumber(),
        status: "pending" satisfies OrderStatus,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone ?? null,
        shippingAddress: input.shippingAddress
            ? { _type: "shippingAddress", ...input.shippingAddress }
            : null,
        notes: input.notes ?? null,
        lines: input.lines.map((l, i) => ({
            _type: "orderLine",
            _key: `line-${i}-${l.productId.slice(-6)}`,
            ...l,
        })),
        subtotal,
        shippingCost,
        discount,
        promoCode: input.promoCode ?? null,
        total: subtotal - discount + shippingCost,
        paymentMethod: input.paymentMethod ?? "cod",
        createdAt: new Date().toISOString(),
        // Stock is taken off the shelf when the owner confirms the order, not
        // when a stranger places one: /api/public/orders needs no login, so
        // decrementing here let anyone run the catalogue down to zero.
        // Availability is still checked before the order is accepted.
        stockApplied: false,
    });

    return (await getOrder(doc._id)) as Order;
}

/** Headline numbers for the dashboard home page. */
export async function getOrderStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    revenue: number;
    recent: Order[];
}> {
    return adminClient().fetch(`{
        "totalOrders": count(*[_type == "order"]),
        "pendingOrders": count(*[_type == "order" && status == "pending"]),
        "revenue": math::sum(*[_type == "order" && status != "cancelled"].total),
        "recent": *[_type == "order"] | order(createdAt desc)[0...5] ${ORDER_PROJECTION}
    }`);
}
