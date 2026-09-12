"use client";

import { useRouter } from "next/navigation";
import OrderListTable from "./OrderListTable";
import type { Product } from "@/types/models";

export default function OrderListClient({ orders }: { orders: Product[] }) {
    const router = useRouter();

    async function handleDelete(id: string) {
        const res = await fetch(`/api/orders?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Could not delete this order");
        }
        router.refresh();
    }

    return <OrderListTable ProductItem={orders} onDelete={handleDelete} />;
}
