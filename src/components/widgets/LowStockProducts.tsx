import Image from "next/image";
import Link from "next/link";
import type { DashboardData } from "@/lib/sanity/analytics";
import { LOW_STOCK_THRESHOLD } from "@/lib/sanity/analytics";

/**
 * Replaces the template's "New Comments" widget, which listed invented reviews
 * from a hardcoded array — this store has no review system, so there was
 * nothing real to show there. Low stock is real, urgent, and actionable.
 */
export default function LowStockProducts({ items }: { items: DashboardData["lowStock"] }) {
    return (
        <div className="wg-box">
            <div className="flex items-center justify-between">
                <h5>Low stock</h5>
                <Link href="/all-product" className="text-tiny">
                    All products
                </Link>
            </div>

            {items.length === 0 ? (
                <div className="body-text" style={{ padding: "28px 0", textAlign: "center", opacity: 0.7 }}>
                    Nothing is running low — every product has more than {LOW_STOCK_THRESHOLD} in stock.
                </div>
            ) : (
                <ul className="flex flex-column">
                    {items.map((p) => (
                        <li key={p._id} className="product-item gap14 mb-20">
                            <div className="image no-bg">
                                <Image
                                    src={p.image || "/images/products/1.png"}
                                    alt={p.title}
                                    width={50}
                                    height={50}
                                    style={{ objectFit: "cover" }}
                                    unoptimized
                                />
                            </div>
                            <div className="flex items-center justify-between gap20 flex-grow">
                                <div className="name">
                                    <Link href={`/edit-product?id=${p._id}`} className="body-title-2">
                                        {p.title}
                                    </Link>
                                    <div className="text-tiny mt-3">{p.category ?? "Uncategorised"}</div>
                                </div>
                                <div
                                    className="body-title-2"
                                    style={{ color: p.stock <= 0 ? "#EF4444" : "#F59E0B", whiteSpace: "nowrap" }}
                                >
                                    {p.stock <= 0 ? "Out of stock" : `${p.stock} left`}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
