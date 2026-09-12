"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/models";

const EMPTY_ORDERS: Product[] = [];

type RecentOrdersProps = {
    recentOrders?: Product[];
    items?: number;
};


export default function RecentOrders({ recentOrders = EMPTY_ORDERS, items = 5 }: RecentOrdersProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = items;

    useEffect(() => {
        setCurrentPage(1);
    }, [recentOrders]);

    const classStatus = (status: string | undefined) => {
        if (!status) return "";
        const normalized = status.toLowerCase();
        if (normalized === "paid") return "block-available";
        if (normalized === "pending") return "block-pending";
        if (normalized === "cancel") return "block-available";
        if (normalized === "processing") return "block-published";
        return "";
    };

    const totalPages = Math.ceil(recentOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = recentOrders.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    return (
        <div className="wg-box">
            <div className="flex items-center justify-between">
                <h5>Recent orders</h5>
            </div>

            <div className="wg-table table-recent-orders2">
                <ul className="table-title flex gap20 mb-14">
                    <li>
                        <div className="body-title text-main-dark">Product</div>
                    </li>
                    <li>
                        <div className="body-title text-main-dark">Quantity</div>
                    </li>
                    <li>
                        <div className="body-title text-main-dark">Price</div>
                    </li>
                    <li>
                        <div className="body-title text-main-dark">Status</div>
                    </li>
                </ul>

                <div className="divider mb-14"></div>

                <ul className="flex flex-column has-divider-line has-line-bot">
                    {currentItems.map((item) => (
                        <li key={item.id} className="item wg-product gap20">
                            <div className="name">
                                <div className="image">
                                    <Image width={50} height={50} src={item.image} alt="image" />
                                </div>
                                <div className="title mb-0">
                                    <Link href={`/product-detail/${item.id}`} className="body-text">
                                        {item.name}
                                    </Link>
                                </div>
                            </div>

                            <div className="body-text text-info mt-4">
                                X{item.quantity ?? ""}
                            </div>

                            <div className="body-text text-info mt-4">
                                {item.price}
                            </div>

                            <div>
                                <div className={`${classStatus(item.status)} fw-7`}>
                                    {item.status || ""}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex items-center justify-between flex-wrap gap10">
                <div className="text-tiny">
                    Showing {recentOrders.length === 0 ? 0 : startIndex + 1}-
                    {Math.min(startIndex + itemsPerPage, recentOrders.length)} of {recentOrders.length}
                </div>

                {totalPages > 0 && (
                    <ul className="wg-pagination">
                        <li className={currentPage === 1 ? "disabled" : ""}>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handlePageChange(currentPage - 1);
                                }}
                            >
                                <i className="icon-chevron-left"></i>
                            </a>
                        </li>

                        {Array.from({ length: totalPages }, (_, i) => (
                            <li
                                key={i + 1}
                                className={currentPage === i + 1 ? "active" : ""}
                            >
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePageChange(i + 1);
                                    }}
                                >
                                    {i + 1}
                                </a>
                            </li>
                        ))}

                        <li className={currentPage === totalPages ? "disabled" : ""}>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handlePageChange(currentPage + 1);
                                }}
                            >
                                <i className="icon-chevron-right"></i>
                            </a>
                        </li>
                    </ul>
                )}
            </div>
        </div>
    );
}