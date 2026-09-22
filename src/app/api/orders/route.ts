import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/session";
import { listOrders, getOrder, updateOrderStatus, deleteOrder, type OrderStatus } from "@/lib/sanity/orders";

const STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

async function guard() {
    const session = await requireSession();
    if (!can(session, "orders")) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return null;
}

export async function GET(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const id = new URL(req.url).searchParams.get("id");
        if (id) {
            const order = await getOrder(id);
            if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });
            return NextResponse.json({ order });
        }
        return NextResponse.json({ orders: await listOrders() });
    } catch (error) {
        console.error("LIST_ORDERS_ERROR", error);
        return NextResponse.json({ message: "Could not load orders" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const body = await req.json();
        const id = String(body.id || "").trim();
        const status = String(body.status || "") as OrderStatus;

        if (!id) return NextResponse.json({ message: "Order id is required" }, { status: 400 });
        if (!STATUSES.includes(status)) {
            return NextResponse.json(
                { message: `Status must be one of: ${STATUSES.join(", ")}` },
                { status: 400 }
            );
        }

        await updateOrderStatus(id, status);
        return NextResponse.json({ message: "Order updated" });
    } catch (error) {
        console.error("UPDATE_ORDER_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const id = new URL(req.url).searchParams.get("id");
        if (!id) return NextResponse.json({ message: "Order id is required" }, { status: 400 });
        await deleteOrder(id);
        return NextResponse.json({ message: "Order deleted" });
    } catch (error) {
        console.error("DELETE_ORDER_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}
