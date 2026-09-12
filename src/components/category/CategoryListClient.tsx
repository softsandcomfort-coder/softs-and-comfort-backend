"use client";

import { useRouter } from "next/navigation";
import CategoryTable from "./CategoryTable";
import type { Category } from "@/types/models";

export default function CategoryListClient({ categories }: { categories: Category[] }) {
    const router = useRouter();

    async function handleDelete(id: string) {
        const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            // 409 = the category still has products attached
            throw new Error(data.message || "Could not delete this category");
        }
        router.refresh();
    }

    return <CategoryTable CategoryItem={categories} onDelete={handleDelete} />;
}
