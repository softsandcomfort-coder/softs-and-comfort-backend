import "server-only";
import { adminClient } from "./client";

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
    total: number;
    paymentMethod: string | null;
    createdAt: string;
};

const ORDER_PROJECTION = `{
    _id, orderNumber, status,
    customerName, customerEmail, customerPhone,
    shippingAddress, notes,
    lines[]{ productId, title, image, unitPrice, qty, size, color },
    subtotal, shippingCost, total, paymentMethod, createdAt
}`;

export async function listOrders(): Promise<Order[]> {
    return adminClient().fetch(`*[_type == "order"] | order(createdAt desc) ${ORDER_PROJECTION}`);
}

export async function getOrder(id: string): Promise<Order | null> {
    return adminClient().fetch(`*[_type == "order" && _id == $id][0] ${ORDER_PROJECTION}`, { id });
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    await adminClient().patch(id).set({ status }).commit();
}

export async function deleteOrder(id: string): Promise<void> {
    await adminClient().delete(id);
}

/** VF-YYMMDD-XXXX — readable, sortable, and unique enough for a small store. */
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
    return `VF-${stamp}-${random}`;
}

export type CreateOrderInput = {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    shippingAddress?: Record<string, string>;
    notes?: string;
    lines: OrderLine[];
    shippingCost?: number;
    paymentMethod?: string;
};

export async function createOrder(input: CreateOrderInput): Promise<Order> {
    // Totals are recomputed here rather than trusted from the request body —
    // a client-supplied total is a client-supplied discount.
    const subtotal = input.lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
    const shippingCost = input.shippingCost ?? 0;

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
        total: subtotal + shippingCost,
        paymentMethod: input.paymentMethod ?? "cod",
        createdAt: new Date().toISOString(),
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
