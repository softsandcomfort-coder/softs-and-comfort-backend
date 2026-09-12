"use client";

import { useRouter } from "next/navigation";
import ProductListTable from "./ProductListTable";
import type { Product } from "@/types/models";

/**
 * Client shell around the template's product table.
 *
 * The page itself is a server component that reads Sanity; this only exists to
 * own the delete call and refresh the server data afterwards.
 */
export default function ProductListClient({ products }: { products: Product[] }) {
    const router = useRouter();

    async function handleDelete(id: string) {
        const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
            method: "DELETE",
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Could not delete this product");
        }
        // re-run the server component so counts and lists stay truthful
        router.refresh();
    }

    return <ProductListTable ProductItem={products} onDelete={handleDelete} />;
}
