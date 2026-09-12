"use client";

import { useRouter } from "next/navigation";
import UserListTable, { type UserRow } from "./UserListTable";

export default function UserListClient({
    users,
    currentUserId,
}: {
    users: UserRow[];
    currentUserId?: string;
}) {
    const router = useRouter();

    async function handleDelete(id: string) {
        const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Could not delete this account");
        }
        router.refresh();
    }

    async function handleToggleActive(id: string, active: boolean) {
        const res = await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, active }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Could not update this account");
        }
        router.refresh();
    }

    return (
        <UserListTable
            users={users}
            currentUserId={currentUserId}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
        />
    );
}
