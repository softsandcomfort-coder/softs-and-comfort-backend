"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/common/ConfirmModal";

/**
 * Dashboard accounts.
 *
 * The template version filtered by roles that do not exist here
 * (Admin/Manager/Staff against real Owner/Staff), rendered a Phone column the
 * schema has no field for, pointed the row's view/edit icons back at the page
 * you were already on, and showed Active/Inactive as read-only text even though
 * `PATCH /api/users` + `setUserActive` existed with no UI consumer.
 */

export type UserRow = {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
    active: boolean;
    createdAt: string;
};

type Props = {
    users: UserRow[];
    /** Current session's user id — you cannot delete or deactivate yourself. */
    currentUserId?: string;
    onDelete?: (id: string) => Promise<void>;
    onToggleActive?: (id: string, active: boolean) => Promise<void>;
};

export default function UserListTable({ users, currentUserId, onDelete, onToggleActive }: Props) {
    const [list, setList] = useState<UserRow[]>(users);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All roles");
    const [statusFilter, setStatusFilter] = useState("All status");
    const [selected, setSelected] = useState<UserRow | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setList(users);
    }, [users]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return list.filter((u) => {
            if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) {
                return false;
            }
            if (roleFilter !== "All roles" && u.role !== roleFilter) return false;
            if (statusFilter === "Active" && !u.active) return false;
            if (statusFilter === "Inactive" && u.active) return false;
            return true;
        });
    }, [list, search, roleFilter, statusFilter]);

    async function handleToggle(user: UserRow) {
        if (!onToggleActive) return;
        setBusyId(user.id);
        setError(null);
        try {
            await onToggleActive(user.id, !user.active);
            setList((prev) =>
                prev.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u))
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not update this account");
        } finally {
            setBusyId(null);
        }
    }

    async function handleConfirmDelete() {
        if (!selected) return;
        const id = selected.id;

        if (onDelete) {
            setDeleting(true);
            setError(null);
            try {
                await onDelete(id);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not delete this account");
                setDeleting(false);
                setSelected(null);
                return;
            }
            setDeleting(false);
        }

        setList((prev) => prev.filter((u) => u.id !== id));
        setSelected(null);
    }

    return (
        <>
            {error && (
                <div className="wg-box mb-20">
                    <div className="body-text" style={{ color: "#e53e3e" }}>{error}</div>
                </div>
            )}

            <div className="wg-box">
                <div className="flex items-center justify-between gap10 flex-wrap">
                    <div className="wg-filter flex-grow">
                        <form className="form-search" onSubmit={(e) => e.preventDefault()}>
                            <fieldset className="name">
                                <input
                                    type="text"
                                    placeholder="Search by name or email…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </fieldset>
                            <div className="button-submit">
                                <button type="submit" aria-label="Search">
                                    <i className="icon-search" />
                                </button>
                            </div>
                        </form>
                    </div>
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option>All roles</option>
                        <option>Owner</option>
                        <option>Staff</option>
                    </select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option>All status</option>
                        <option>Active</option>
                        <option>Inactive</option>
                    </select>
                    <Link className="tf-button style-1 w208" href="/add-new-user">
                        <i className="icon-plus" />
                        Add user
                    </Link>
                </div>

                <div className="wg-table table-all-user">
                    <ul className="table-title flex gap20 mb-14">
                        <li>
                            <div className="body-title">Name</div>
                        </li>
                        <li>
                            <div className="body-title">Role</div>
                        </li>
                        <li>
                            <div className="body-title">Permissions</div>
                        </li>
                        <li>
                            <div className="body-title">Status</div>
                        </li>
                        <li>
                            <div className="body-title">Action</div>
                        </li>
                    </ul>

                    {filtered.length === 0 ? (
                        <div
                            className="body-text"
                            style={{ padding: "40px 0", textAlign: "center", opacity: 0.7 }}
                        >
                            {list.length === 0 ? "No accounts yet." : "No accounts match those filters."}
                        </div>
                    ) : (
                        <ul className="flex flex-column">
                            {filtered.map((u) => {
                                const isSelf = u.id === currentUserId;
                                return (
                                    <li key={u.id} className="wg-product item-row gap20">
                                        <div className="name flex-grow">
                                            <div className="body-title-2">
                                                {u.name}
                                                {isSelf && (
                                                    <span className="text-tiny"> (you)</span>
                                                )}
                                            </div>
                                            <div className="text-tiny">{u.email}</div>
                                        </div>
                                        <div className="body-text">{u.role}</div>
                                        <div className="body-text">
                                            {u.role === "Owner"
                                                ? "Full access"
                                                : u.permissions.length > 0
                                                  ? u.permissions.join(", ")
                                                  : "None"}
                                        </div>
                                        <div
                                            className="body-title-2"
                                            style={{ color: u.active ? "#22C55E" : "#EF4444" }}
                                        >
                                            {u.active ? "Active" : "Inactive"}
                                        </div>
                                        <div className="list-icon-function">
                                            <button
                                                type="button"
                                                className="item"
                                                title={u.active ? "Deactivate" : "Activate"}
                                                disabled={isSelf || busyId === u.id}
                                                onClick={() => handleToggle(u)}
                                                style={{
                                                    background: "none",
                                                    border: 0,
                                                    cursor: isSelf ? "not-allowed" : "pointer",
                                                    opacity: isSelf ? 0.4 : 1,
                                                }}
                                            >
                                                <i
                                                    className={
                                                        u.active ? "icon-toggle-right" : "icon-toggle-left"
                                                    }
                                                />
                                            </button>
                                            <button
                                                type="button"
                                                className="item trash"
                                                title={isSelf ? "You cannot delete yourself" : "Delete"}
                                                disabled={isSelf}
                                                onClick={() => setSelected(u)}
                                                style={{
                                                    background: "none",
                                                    border: 0,
                                                    cursor: isSelf ? "not-allowed" : "pointer",
                                                    opacity: isSelf ? 0.4 : 1,
                                                }}
                                            >
                                                <i className="icon-trash-2" />
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="divider" />
                <div className="text-tiny">
                    Showing {filtered.length} of {list.length}
                </div>
            </div>

            <ConfirmModal
                open={!!selected}
                title="Confirm delete"
                message={
                    selected ? (
                        <>
                            Delete the account for <strong>{selected.name}</strong> ({selected.email})?
                            They will lose access immediately.
                        </>
                    ) : null
                }
                confirmText="Delete"
                busy={deleting}
                onConfirm={handleConfirmDelete}
                onCancel={() => setSelected(null)}
            />
        </>
    );
}
