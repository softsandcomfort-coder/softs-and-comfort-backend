import Image from "next/image";
import Link from "next/link";
import type { ProductDetail } from "@/lib/sanity/catalog";

/**
 * Read-only product view.
 *
 * The template version fell back to `allProducts[0]` from a fixtures file when
 * it could not find a product, showed a hardcoded "(134 reviews)" count, linked
 * to a "Dataflow" vendor, and rendered a tabbed panel of invented customer
 * reviews with replies. This store has no review system, so all of that is
 * gone; what remains is the product as it actually exists in Sanity.
 */

const money = (n: number | null | undefined) => `Rs ${Math.round(n ?? 0).toLocaleString("en-PK")}`;

export default function ProductDetailView({ product }: { product: ProductDetail }) {
    const onSale = product.salePrice != null && product.salePrice < product.price;
    const images = (product.images ?? []).filter((i) => i?.url);

    return (
        <div className="tf-section-1">
            <div className="wg-box">
                <div className="mb-20">
                    <Image
                        src={images[0]?.url || "/images/products/1.png"}
                        alt={product.title}
                        width={520}
                        height={520}
                        style={{ width: "100%", height: "auto", borderRadius: 12, objectFit: "cover" }}
                        unoptimized
                    />
                </div>
                {images.length > 1 && (
                    <div className="flex gap10 flex-wrap">
                        {images.slice(1).map((img) => (
                            <Image
                                key={img.assetId}
                                src={img.url}
                                alt=""
                                width={84}
                                height={84}
                                style={{ borderRadius: 8, objectFit: "cover" }}
                                unoptimized
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-column gap20">
                <div className="wg-box gap10">
                    <h5>{product.title}</h5>
                    <div className="flex items-center gap10">
                        <div className="h5 tf-color-1">
                            {money(onSale ? product.salePrice : product.price)}
                        </div>
                        {onSale && (
                            <del className="body-text" style={{ opacity: 0.6 }}>
                                {money(product.price)}
                            </del>
                        )}
                    </div>
                    {product.description && (
                        <div className="body-text" style={{ whiteSpace: "pre-line" }}>
                            {product.description}
                        </div>
                    )}
                </div>

                <div className="wg-box gap10">
                    <div className="body-title">Details</div>
                    <div className="flex justify-between">
                        <div className="body-text">Category</div>
                        <div className="body-title-2">{product.categoryName ?? "Uncategorised"}</div>
                    </div>
                    <div className="flex justify-between">
                        <div className="body-text">Stock</div>
                        <div
                            className="body-title-2"
                            style={{ color: (product.stock ?? 0) > 0 ? "#22C55E" : "#EF4444" }}
                        >
                            {(product.stock ?? 0) > 0 ? `${product.stock} in stock` : "Out of stock"}
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <div className="body-text">SKU</div>
                        <div className="body-title-2">{product.sku || "—"}</div>
                    </div>
                    <div className="flex justify-between">
                        <div className="body-text">Brand</div>
                        <div className="body-title-2">{product.brand || "—"}</div>
                    </div>
                    <div className="flex justify-between">
                        <div className="body-text">Slug</div>
                        <div className="body-title-2">{product.slug ?? "—"}</div>
                    </div>
                </div>

                {(product.sizes?.length ?? 0) > 0 && (
                    <div className="wg-box gap10">
                        <div className="body-title">Sizes</div>
                        <div className="flex gap10 flex-wrap">
                            {product.sizes.map((s) => (
                                <span key={s} className="tf-button style-3" style={{ minWidth: 48 }}>
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {(product.colors?.length ?? 0) > 0 && (
                    <div className="wg-box gap10">
                        <div className="body-title">Colours</div>
                        <div className="flex gap10 flex-wrap items-center">
                            {product.colors.map((c) => (
                                <span
                                    key={c.hex}
                                    title={c.name}
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: "50%",
                                        background: c.hex,
                                        border: "1px solid rgba(0,0,0,.2)",
                                        display: "inline-block",
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {(product.tags?.length ?? 0) > 0 && (
                    <div className="wg-box gap10">
                        <div className="body-title">Tags</div>
                        <div className="body-text">{product.tags.join(", ")}</div>
                    </div>
                )}

                <Link className="tf-button w-full" href={`/edit-product?id=${product._id}`}>
                    Edit product
                </Link>
            </div>
        </div>
    );
}
