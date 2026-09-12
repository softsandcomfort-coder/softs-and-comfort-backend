"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConfirmModal from "@/components/common/ConfirmModal";
import Link from "next/link";
import { Product } from "@/types/models";
import Image from "next/image";

const EMPTY_ORDERS: Product[] = [];

type OrderListProps = {
    ProductItem?: Product[];
    /** When supplied, the trash icon deletes the order in Sanity. */
    onDelete?: (id: string) => Promise<void>;
};

const parsePrice = (value: string) =>
    parseFloat(value.replace(/[^0-9.-]+/g, ""));
const parseQuantity = (value: string) =>
    parseFloat(value.replace(/[^0-9.-]+/g, ""));

export default function OrderListTable({
    ProductItem = EMPTY_ORDERS,
    onDelete,
}: OrderListProps) {
    const [list, setList] = useState<Product[]>(ProductItem);
    const [entries, setEntries] = useState("10");
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All Categories");
    const [status, setStatus] = useState("All Status");
    const [sortBy, setSortBy] = useState("Sort by (Defaut)");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState<Product | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        setList(ProductItem ?? []);
    }, [ProductItem]);

    const processedData = useMemo(() => {
        let result = [...list];

        if (search.trim()) {
            const keyword = search.toLowerCase();
            result = result.filter(
                (item) =>
                    item.name.toLowerCase().includes(keyword) ||
                    String(item.productId).includes(keyword),
            );
        }

        if (category !== "All Categories") {
            result = result.filter((item) => item.category === category);
        }

        if (status !== "All Status") {
            result = result.filter((item) => item.status === status);
        }

        if (sortBy === "ID") {
            result.sort((a, b) => {
                const idA =
                    typeof a.id === "number"
                        ? a.id
                        : parseInt(a.id as string, 10);
                const idB =
                    typeof b.id === "number"
                        ? b.id
                        : parseInt(b.id as string, 10);
                return (isNaN(idA) ? 0 : idA) - (isNaN(idB) ? 0 : idB);
            });
        }

        if (sortBy === "Name") {
            result.sort((a, b) => a.name.localeCompare(b.name));
        }

        if (sortBy === "Price") {
            result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        }

        return result;
    }, [list, search, category, status, sortBy]);

    const itemsPerPage = Number(entries);
    const totalPages = Math.max(
        1,
        Math.ceil(processedData.length / itemsPerPage),
    );
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = processedData.slice(startIndex, endIndex);

    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
        // eslint-disable-next-line
    }, [entries, search, category, status, sortBy]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    };

    const handleDelete = async () => {
        if (!selectedItem) return;
        if (onDelete) {
            setDeleting(true);
            setDeleteError(null);
            try {
                await onDelete(String(selectedItem.id));
            } catch (err) {
                setDeleteError(err instanceof Error ? err.message : "Could not delete this order");
                setDeleting(false);
                setSelectedItem(null);
                return;
            }
            setDeleting(false);
        }

        setList((prev) => prev.filter((item) => item.id !== selectedItem.id));
        setSelectedItem(null);
    };

    const getStatusClass = (value: Product["status"]) => {
        if (value === "Delivered") return "block-available bg-1 fw-7";
        if (value === "Cancelled") return "block-stock bg-1 fw-7";
        if (value === "Pending") return "block-pending bg-1 fw-7";
        return "block-pending bg-1 text-blue fw-7";
    };

    return (
        <>
            {deleteError && (
                <div className="wg-box mb-20">
                    <div className="body-text" style={{ color: "#e53e3e" }}>{deleteError}</div>
                </div>
            )}
            <div className="wg-box">
                <div className="flex items-center justify-between gap10 flex-wrap">
                    <div className="wg-filter flex-grow">
                        <div className="show">
                            <div className="text-tiny">Showing</div>
                            <div className="select">
                                <select
                                    value={entries}
                                    onChange={(e) => setEntries(e.target.value)}
                                >
                                    <option>10</option>
                                    <option>20</option>
                                    <option>30</option>
                                </select>
                            </div>
                            <div className="text-tiny">entries</div>
                        </div>

                        <form
                            className="form-search"
                            onSubmit={handleSearchSubmit}
                        >
                            <fieldset className="name">
                                <input
                                    type="text"
                                    placeholder="Search here..."
                                    name="name"
                                    tabIndex={2}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    required
                                />
                            </fieldset>
                            <div className="button-submit">
                                <button type="submit">
                                    <i className="icon-search"></i>
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="flex items-center justify-between gap10 flex-wrap">
                        <div className="tf-select">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option>All Categories</option>
                                <option>cod</option>
                                <option>bank</option>
                                <option>card</option>
                            </select>
                        </div>

                        <div className="tf-select">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option>All Status</option>
                                <option>Pending</option>
                                <option>Confirmed</option>
                                <option>Shipped</option>
                                <option>Delivered</option>
                                <option>Cancelled</option>
                            </select>
                        </div>

                        <div className="tf-select">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option>Sort by (Defaut)</option>
                                <option>ID</option>
                                <option>Name</option>
                                <option>Price</option>
                            </select>
                        </div>

                    </div>
                </div>

                <div className="wg-table table-all-order">
                    <ul className="table-title bg-dark-1 flex gap20 mb-14">
                        <li>
                            <div className="body-title">Product</div>
                        </li>
                        <li>
                            <div className="body-title">Order ID</div>
                        </li>
                        <li>
                            <div className="body-title">Price</div>
                        </li>
                        <li>
                            <div className="body-title">Quantity</div>
                        </li>
                        <li>
                            <div className="body-title">Payment</div>
                        </li>
                        <li>
                            <div className="body-title">Status</div>
                        </li>
                        <li>
                            <div className="body-title">Tracking</div>
                        </li>
                        <li>
                            <div className="body-title">Action</div>
                        </li>
                    </ul>

                    <ul className="flex flex-column">
                        {paginatedData.map((item) => (
                            <li
                                className="wg-product item-row gap20"
                                key={item.id}
                            >
                                <div className="name">
                                    <div className="image">
                                        <Image width={50} height={50} src={item.image} alt="image" />
                                    </div>
                                    <div className="title line-clamp-2 mb-0">
                                        <Link
                                            href={`/order-detail?id=${item.id}`}
                                            className="body-title-2"
                                        >
                                            {item.name}
                                        </Link>
                                    </div>
                                </div>

                                <div className="body-text text-info mt-4">
                                    {item.productId}
                                </div>
                                <div className="body-text text-info mt-4">
                                    {item.price}
                                </div>
                                <div className="body-text text-info mt-4">
                                    {item.quantity}
                                </div>
                                <div className="body-text text-info mt-4">
                                    {item.payment}
                                </div>

                                <div>
                                    <div
                                        className={getStatusClass(item.status)}
                                    >
                                        {item.status}
                                    </div>
                                </div>

                                <div>
                                    <a
                                        className="block-tracking bg-1"
                                        href={`/order-tracking?id=${item.id}`}
                                    >
                                        Tracking
                                    </a>
                                </div>

                                <div className="list-icon-function">
                                    <a
                                        href={`/order-detail?id=${item.id}`}
                                        className="item eye"
                                    >
                                        <i className="icon-eye text-main"></i>
                                    </a>
                                    <a
                                        href={`/order-detail?id=${item.id}`}
                                        className="item edit"
                                        title="Change status"
                                    >
                                        <i className="icon-edit-3"></i>
                                    </a>
                                    <div
                                        className="item trash"
                                        onClick={() => setSelectedItem(item)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <i className="icon-trash-2"></i>
                                    </div>
                                </div>
                            </li>
                        ))}

                        {paginatedData.length === 0 && (
                            <li className="body-text text-center">
                                No orders found
                            </li>
                        )}
                    </ul>
                </div>

                <div className="divider"></div>

                <div className="flex items-center justify-between flex-wrap gap10">
                    <div className="text-tiny color-body">
                        {processedData.length > 0
                            ? `Showing ${startIndex + 1} to ${Math.min(
                                  endIndex,
                                  processedData.length,
                              )} of ${processedData.length} entries`
                            : "Showing 0 entries"}
                    </div>

                    {totalPages > 1 && (
                        <ul className="wg-pagination">
                            <li>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (safeCurrentPage > 1)
                                            setCurrentPage(safeCurrentPage - 1);
                                    }}
                                >
                                    <i className="icon-chevron-left"></i>
                                </a>
                            </li>

                            {Array.from({ length: totalPages }, (_, index) => {
                                const page = index + 1;
                                return (
                                    <li
                                        key={page}
                                        className={
                                            safeCurrentPage === page
                                                ? "active"
                                                : ""
                                        }
                                    >
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setCurrentPage(page);
                                            }}
                                        >
                                            {page}
                                        </a>
                                    </li>
                                );
                            })}

                            <li>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (safeCurrentPage < totalPages) {
                                            setCurrentPage(
                                                safeCurrentPage + 1,
                                            );
                                        }
                                    }}
                                >
                                    <i className="icon-chevron-right"></i>
                                </a>
                            </li>
                        </ul>
                    )}
                </div>
            </div>

            <ConfirmModal
                open={!!selectedItem}
                title="Confirm delete"
                message={
                    selectedItem ? (
                        <>
                            Are you sure you want to delete order{" "}
                            <strong>{selectedItem.id}</strong> -{" "}
                            {selectedItem.name}?
                        </>
                    ) : null
                }
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                busy={deleting}
                onCancel={() => setSelectedItem(null)}
            />
        </>
    );
}
