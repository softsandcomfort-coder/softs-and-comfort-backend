"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/common/ConfirmModal";
import type { AttributeItem } from "@/lib/sanity/catalog";

/**
 * Attributes list.
 *
 * The template version stamped every row with an invented `group: "TShirt"` and
 * `status: "Publish"`, then offered filters for TShirt/Pants/Hat and
 * Publish/Draft — selecting anything but the first option always produced an
 * empty table, implying a categorisation and a draft workflow that do not
 * exist. It also sorted by "Price" and "Payment" on a screen with neither, and
 * its edit icon linked to the blank create form.
 *
 * The Sanity `attribute` schema has exactly two fields: name and values.
 */

type Props = {
    attributes: AttributeItem[];
    onDelete?: (id: string) => Promise<void>;
};

const PAGE_SIZES = ["10", "20", "50"];

export default function AttributeTable({ attributes, onDelete }: Props) {
    const [list, setList] = useState<AttributeItem[]>(attributes);
    const [search, setSearch] = useState("");
    const [entries, setEntries] = useState("10");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<AttributeItem | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setList(attributes);
    }, [attributes]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return list;
        return list.filter(
            (a) =>
                a.name.toLowerCase().includes(q) ||
                (a.values ?? []).some((v) => v.toLowerCase().includes(q))
        );
    }, [list, search]);

    const perPage = Number(entries);
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * perPage;
    const pageItems = filtered.slice(start, start + perPage);

    useEffect(() => {
        setPage(1);
    }, [search, entries]);

    async function handleConfirmDelete() {
        if (!selected) return;
        const id = selected._id;

        if (onDelete) {
            setDeleting(true);
            setError(null);
            try {
                await onDelete(id);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not delete this attribute");
                setDeleting(false);
                setSelected(null);
                return;
            }
            setDeleting(false);
        }

        setList((prev) => prev.filter((a) => a._id !== id));
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
                                    placeholder="Search by name or value…"
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
                    <Link className="tf-button style-1 w208" href="/add-attributes">
                        <i className="icon-plus" />
                        Add attribute
                    </Link>
                </div>

                <div className="wg-table table-all-attribute">
                    <ul className="table-title flex gap20 mb-14">
                        <li>
                            <div className="body-title">Name</div>
                        </li>
                        <li>
                            <div className="body-title">Values</div>
                        </li>
                        <li>
                            <div className="body-title">Action</div>
                        </li>
                    </ul>

                    {pageItems.length === 0 ? (
                        <div
                            className="body-text"
                            style={{ padding: "40px 0", textAlign: "center", opacity: 0.7 }}
                        >
                            {list.length === 0
                                ? "No attributes yet."
                                : "No attributes match that search."}
                        </div>
                    ) : (
                        <ul className="flex flex-column">
                            {pageItems.map((a) => (
                                <li key={a._id} className="attribute-item flex items-center justify-between gap20">
                                    <div className="body-title-2">{a.name}</div>
                                    <div className="body-text flex-grow">
                                        {(a.values ?? []).join(", ") || "—"}
                                    </div>
                                    <div className="list-icon-function">
                                        <Link href={`/add-attributes?id=${a._id}`} className="item edit">
                                            <i className="icon-edit-3" />
                                        </Link>
                                        <div
                                            className="item trash"
                                            onClick={() => setSelected(a)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <i className="icon-trash-2" />
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="divider" />

                <div className="flex items-center justify-between flex-wrap gap10">
                    <div className="text-tiny">
                        Showing {filtered.length === 0 ? 0 : start + 1}–
                        {Math.min(start + perPage, filtered.length)} of {filtered.length}
                    </div>
                    <div className="flex items-center gap10">
                        <div className="text-tiny">Per page</div>
                        <select value={entries} onChange={(e) => setEntries(e.target.value)}>
                            {PAGE_SIZES.map((n) => (
                                <option key={n}>{n}</option>
                            ))}
                        </select>
                    </div>
                    {totalPages > 1 && (
                        <ul className="wg-pagination">
                            <li>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (safePage > 1) setPage(safePage - 1);
                                    }}
                                >
                                    <i className="icon-chevron-left" />
                                </a>
                            </li>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                                <li key={n} className={safePage === n ? "active" : ""}>
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setPage(n);
                                        }}
                                    >
                                        {n}
                                    </a>
                                </li>
                            ))}
                            <li>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (safePage < totalPages) setPage(safePage + 1);
                                    }}
                                >
                                    <i className="icon-chevron-right" />
                                </a>
                            </li>
                        </ul>
                    )}
                </div>
            </div>

            <ConfirmModal
                open={!!selected}
                title="Confirm delete"
                message={
                    selected ? (
                        <>
                            Delete the attribute <strong>{selected.name}</strong>? Products already
                            tagged with its values are not affected.
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
