"use client";

import { useSearchParams } from "next/navigation";
import ProductForm from "./ProductForm";

/**
 * Reads ?id= and hands it to the shared form, which loads that product before
 * allowing a save. The previous version PUT form defaults over the real record.
 */
export default function EditProductForm() {
    const searchParams = useSearchParams();
    const productId = searchParams.get("id") || "";

    if (!productId) {
        return (
            <div className="wg-box">
                <div className="body-text" style={{ padding: "32px 0", textAlign: "center" }}>
                    No product selected. Open a product from the All Products list to edit it.
                </div>
            </div>
        );
    }

    return <ProductForm productId={productId} />;
}
