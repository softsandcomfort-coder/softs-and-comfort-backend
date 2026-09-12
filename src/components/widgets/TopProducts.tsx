import Image from "next/image";
import Link from "next/link";
import type { DashboardData } from "@/lib/sanity/analytics";
import { formatPkr } from "@/lib/sanity/analytics";

/**
 * Best sellers, aggregated from order lines.
 *
 * Replaces the template's "Top page posts" widget, which listed page paths,
 * view counts and exit rates — all of which need web analytics this store does
 * not collect. Units sold and revenue per product are real.
 */
export default function TopProducts({ items }: { items: DashboardData["topProducts"] }) {
    return (
        <div className="wg-box w-half">
            <div className="flex items-center justify-between">
                <h5>Best sellers</h5>
                <Link href="/all-product" className="text-tiny">
                    All products
                </Link>
            </div>

            {items.length === 0 ? (
                <div className="body-text" style={{ padding: "32px 0", textAlign: "center", opacity: 0.7 }}>
                    No sales yet — best sellers appear once orders come in.
                </div>
            ) : (
                <>
                    <ul className="flex justify-between gap20 mb-14">
                        <li>
                            <div className="body-title text-main-dark">Product</div>
                        </li>
                        <li>
                            <div className="body-title text-main-dark">Units / Revenue</div>
                        </li>
                    </ul>
                    <ul className="flex flex-column h-full line-top">
                        {items.map((p) => (
                            <li className="wg-product" key={p.productId}>
                                <div className="name flex-grow">
                                    <div className="image no-bg">
                                        <Image
                                            src={p.image || "/images/products/1.png"}
                                            alt={p.title}
                                            width={36}
                                            height={36}
                                            style={{ objectFit: "cover" }}
                                            unoptimized
                                        />
                                    </div>
                                    <div>
                                        <div className="title">
                                            <Link
                                                href={`/edit-product?id=${p.productId}`}
                                                className="body-text"
                                            >
                                                {p.title}
                                            </Link>
                                        </div>
                                        <div className="text-tiny">{p.units} sold</div>
                                    </div>
                                </div>
                                <div className="price body-text">{formatPkr(p.revenue)}</div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}
