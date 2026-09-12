"use client";

import { useRouter } from "next/navigation";
import AttributeTable from "./AttributeTable";
import type { AttributeItem } from "@/lib/sanity/catalog";

export default function AttributeListClient({ attributes }: { attributes: AttributeItem[] }) {
    const router = useRouter();

    async function handleDelete(id: string) {
        const res = await fetch(`/api/attributes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Could not delete this attribute");
        }
        router.refresh();
    }

    return <AttributeTable attributes={attributes} onDelete={handleDelete} />;
}
