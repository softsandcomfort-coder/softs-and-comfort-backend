import type { Product } from "@/types/models";
import type { ProductListItem, CategoryItem } from "./catalog";
import type { Order } from "./orders";

/**
 * Adapters from Sanity documents to the shapes the template's table components
 * already expect. Mapping here rather than rewriting each table keeps the
 * template's markup and styling intact while the data underneath becomes real.
 */

const PLACEHOLDER_IMAGE = "/images/products/placeholder.png";

export const money = (n: number | null | undefined) =>
    n == null ? "Rs 0" : `Rs ${n.toLocaleString("en-PK")}`;

const shortDate = (iso: string | null | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
        ? ""
        : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export function productToRow(p: ProductListItem): Product {
    const stock = p.stock ?? 0;
    return {
        id: p._id,
        // the template shows a short human-facing code in this column
        productId: p.sku || p._id.slice(-8).toUpperCase(),
        name: p.title,
        image: p.image || PLACEHOLDER_IMAGE,
        price: money(p.salePrice ?? p.price),
        quantity: stock,
        category: p.categoryName ?? "Uncategorised",
        sale: p.salePrice ?? 0,
        stock: stock > 0 ? "In Stock" : "Out of stock",
        startDate: shortDate(p.publishedAt),
        status: stock > 0 ? "Complete" : "Pending",
    };
}

export function categoryToRow(c: CategoryItem): Product {
    return {
        id: c._id,
        productId: c.slug ?? c._id.slice(-8),
        name: c.name,
        image: c.image || PLACEHOLDER_IMAGE,
        price: "",
        quantity: c.productCount,
        category: c.group ?? "",
        stock: c.productCount > 0 ? "In Stock" : "Out of stock",
        desc: c.group ?? "",
    };
}

export type OrderRow = {
    id: string;
    orderNumber: string;
    customer: string;
    email: string;
    total: string;
    status: string;
    itemCount: number;
    date: string;
    paymentMethod: string;
};

export function orderToRow(o: Order): OrderRow {
    return {
        id: o._id,
        orderNumber: o.orderNumber,
        customer: o.customerName ?? "Guest",
        email: o.customerEmail ?? "",
        total: money(o.total),
        status: o.status,
        itemCount: (o.lines ?? []).reduce((n, l) => n + (l.qty ?? 0), 0),
        date: shortDate(o.createdAt),
        paymentMethod: o.paymentMethod ?? "cod",
    };
}
