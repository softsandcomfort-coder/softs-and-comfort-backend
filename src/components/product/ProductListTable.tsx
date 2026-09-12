"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConfirmModal from "@/components/common/ConfirmModal";
import Link from "next/link";
import { Product } from "@/types/models";
import Image from "next/image";

const EMPTY_PRODUCT: Product[] = [];

type ProductListProps = {
    ProductItem?: Product[];
    /** Supplied by /all-product so the trash icon deletes in Sanity, not just on screen. */
    onDelete?: (id: string) => Promise<void>;
};

const parsePrice = (value: string) =>
    parseFloat(value.replace(/[^0-9.-]+/g, ""));

function safeToLower(val: string | number | undefined | null) {
    if (typeof val === "string") {
        return val.toLowerCase();
    }
    if (typeof val === "number") {
        return val.toString();
    }
    return "";
}

export default function ProductListTable({ ProductItem = EMPTY_PRODUCT, onDelete }: ProductListProps) {
    const [list, setList] = useState<Product[]>(ProductItem);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [entries, setEntries] = useState("10");
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All Categories");
    const [status, setStatus] = useState("All Status");
    const [sortBy, setSortBy] = useState("Sort by (Defaut)");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState<Product | null>(null);

    useEffect(() => { setList(ProductItem); }, [ProductItem]);

    const processedData = useMemo(() => {
        let result = [...list];

        if (search.trim()) {
            const keyword = search.toLowerCase();
            result = result.filter(
                (item) =>
                    safeToLower(item.name).includes(keyword) ||
                    safeToLower(item.id).includes(keyword),
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
                const aId = typeof a.id === "string" ? a.id : a.id?.toString() ?? "";
                const bId = typeof b.id === "string" ? b.id : b.id?.toString() ?? "";
                return aId.localeCompare(bId);
            });
        }

        if (sortBy === "Name") {
            result.sort((a, b) => {
                const aName = typeof a.name === "string" ? a.name : "";
                const bName = typeof b.name === "string" ? b.name : "";
                return aName.localeCompare(bName);
            });
        }

        if (sortBy === "Price") {
            result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        }

        if (sortBy === "Payment") {
            result.sort((a, b) => {
                const saleA = a.sale ?? 0;
                const saleB = b.sale ?? 0;
                return saleB - saleA;
            });
        }

        return result;
    }, [list, search, category, status, sortBy]);

    // only offer categories that products in this list actually use
    const categoryOptions = useMemo(
        () => [...new Set(list.map((p) => p.category).filter((c): c is string => Boolean(c)))].sort(),
        [list]
    );

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
        setCurrentPage(1);
    }, [entries, search, category, status, sortBy]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const handleSubmitSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    };

    const handleDeleteClick = (item: Product) => {
        setSelectedItem(item);
    };

    const handleCloseModal = () => {
        setSelectedItem(null);
    };

    const handleConfirmDelete = async () => {
        if (!selectedItem) return;
        const id = String(selectedItem.id);

        if (onDelete) {
            setDeleting(true);
            setError(null);
            try {
                await onDelete(id);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not delete this product");
                setDeleting(false);
                setSelectedItem(null);
                return;
            }
            setDeleting(false);
        }

        setList((prev) => prev.filter((item) => String(item.id) !== id));
        setSelectedItem(null);
    };

    return (
        <>
            {error && (
                <div className="wg-box mb-20">
                    <div className="body-text" style={{ color: "#e53e3e" }}>{error}</div>
                </div>
            )}
            <div className="wg-box">
                <div className="title-box">
                    <i className="icon-coffee"></i>
                    <div className="body-text">
                        Tip search by Product ID: Each product is provided with
                        a unique ID, which you can rely on to find the exact
                        product you need.
                    </div>
                </div>

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
                            onSubmit={handleSubmitSearch}
                        >
                            <fieldset className="name">
                                <input
                                    type="text"
                                    placeholder="Search here..."
                                    name="name"
                                    tabIndex={2}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
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
                                {categoryOptions.map((name) => (
                                    <option key={name}>{name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="tf-select">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option>All Status</option>
                                <option>Complete</option>
                                <option>Pending</option>
                                <option>New</option>
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
                                <option>Payment</option>
                            </select>
                        </div>

                        <Link className="tf-button px-40" href={'/add-product'}>
                            <i className="icon-plus"></i>
                            Add new
                        </Link>
                    </div>
                </div>

                <div className="wg-table table-product-list">
                    <ul className="table-title flex gap20 mb-14">
                        <li>
                            <div className="body-title">Product</div>
                        </li>
                        <li>
                            <div className="body-title">Product ID</div>
                        </li>
                        <li>
                            <div className="body-title">Price</div>
                        </li>
                        <li>
                            <div className="body-title">Quantity</div>
                        </li>
                        <li>
                            <div className="body-title">Sale</div>
                        </li>
                        <li>
                            <div className="body-title">Stock</div>
                        </li>
                        <li>
                            <div className="body-title">Start date</div>
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
                                            href={`/product-detail/${item.id}`}
                                            className="body-text"
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
                                    {item.quantity &&
                                    typeof item.quantity === "number"
                                        ? item.quantity.toLocaleString()
                                        : item.quantity}
                                </div>
                                <div className="body-text text-info mt-4">
                                    {item.sale}
                                </div>

                                <div>
                                    <div
                                        className={
                                            item.stock === "In Stock"
                                                ? "block-available bg-1 fw-7"
                                                : "block-stock bg-1 fw-7"
                                        }
                                    >
                                        {item.stock}
                                    </div>
                                </div>

                                <div className="body-text text-info mt-4">
                                    {item.startDate}
                                </div>

                                <div className="list-icon-function">
                                    <Link
                                        href={`/product-detail/${item.id}`}
                                        className="item eye"
                                    >
                                        <i className="icon-eye text-main"></i>
                                    </Link>

                                    <Link
                                        href={`/edit-product?id=${item.id}`}
                                        className="item edit"
                                    >
                                        <i className="icon-edit-3"></i>
                                    </Link>

                                    <div
                                        className="item trash"
                                        onClick={() => handleDeleteClick(item)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <i className="icon-trash-2"></i>
                                    </div>
                                </div>
                            </li>
                        ))}

                        {paginatedData.length === 0 && (
                            <div className="body-text text-center">
                                No products found
                            </div>
                        )}
                    </ul>
                </div>

                <div className="divider"></div>

                <div className="flex items-center justify-between flex-wrap gap10">
                    <div className="text-tiny text-surface-2">
                        {processedData.length > 0
                            ? `Showing ${startIndex + 1} to ${Math.min(
                                  endIndex,
                                  processedData.length,
                              )} of ${processedData.length} entries`
                            : "Showing 0 entries"}
                    </div>

                    {/* Ẩn pagination nếu chỉ có 1 trang */}
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
                                            setCurrentPage(safeCurrentPage + 1);
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
                            Are you sure you want to delete product{" "}
                            <strong>{selectedItem.name}</strong> (
                            {selectedItem.id})?
                        </>
                    ) : null
                }
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleConfirmDelete}
                busy={deleting}
                onCancel={handleCloseModal}
            />
        </>
    );
};
