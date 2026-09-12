import "server-only";
import { catalogClient } from "./client";

/**
 * Stock movements.
 *
 * Selling did not previously change stock at all, so "5 left" stayed 5 no
 * matter how many orders were placed, and the low-stock warning never fired.
 *
 * Two rules:
 *  · An order cannot be placed for more than exists. Overselling a physical
 *    garment means telling a customer it is on its way when it is not.
 *  · Cancelling an order puts the stock back, otherwise every cancellation
 *    silently shrinks the inventory.
 *
 * Products with no `stock` value are treated as untracked and skipped rather
 * than assumed to be zero — that is the schema default, and blocking sales on
 * it would stop the store dead the first time someone leaves the field blank.
 */

export type StockLine = { productId: string; qty: number };

export type StockCheck =
    | { ok: true }
    | {
          ok: false;
          message: string;
          shortfalls: { title: string; available: number; wanted: number }[];
      };

type StockRow = { _id: string; title: string; stock: number | null };

async function fetchStock(ids: string[]): Promise<Map<string, StockRow>> {
    const rows = await catalogClient().fetch<StockRow[]>(
        `*[_type == "product" && _id in $ids]{ _id, title, stock }`,
        { ids }
    );
    return new Map((rows ?? []).map((r) => [r._id, r]));
}

/**
 * Sums demand per product. Several cart lines can point at the same product in
 * different sizes or colours, so they have to be combined before comparing with
 * what is on the shelf.
 */
function totalPerProduct(lines: StockLine[]): Map<string, number> {
    const totals = new Map<string, number>();
    for (const line of lines) {
        totals.set(line.productId, (totals.get(line.productId) ?? 0) + line.qty);
    }
    return totals;
}

/** Confirms every line can be fulfilled. Call before creating the order. */
export async function checkStock(lines: StockLine[]): Promise<StockCheck> {
    if (lines.length === 0) return { ok: true };

    const byId = await fetchStock(lines.map((l) => l.productId));
    const wanted = totalPerProduct(lines);

    const shortfalls: { title: string; available: number; wanted: number }[] = [];
    for (const [productId, qty] of wanted) {
        const row = byId.get(productId);
        if (!row) continue;                 // missing products are caught upstream
        if (row.stock == null) continue;    // untracked
        if (row.stock < qty) {
            shortfalls.push({ title: row.title, available: row.stock, wanted: qty });
        }
    }

    if (shortfalls.length === 0) return { ok: true };

    const message = shortfalls
        .map((s) =>
            s.available === 0
                ? `${s.title} is out of stock`
                : `Only ${s.available} left of ${s.title}`
        )
        .join(". ");

    return { ok: false, message, shortfalls };
}

/**
 * Applies a stock movement. `direction` is -1 to sell and +1 to restore.
 *
 * All lines move in one transaction, so an order never half-decrements.
 * `dec`/`inc` are evaluated server-side, which keeps concurrent orders from
 * clobbering each other the way a read-modify-write would.
 */
async function moveStock(lines: StockLine[], direction: -1 | 1): Promise<void> {
    if (lines.length === 0) return;

    const byId = await fetchStock(lines.map((l) => l.productId));
    const totals = totalPerProduct(lines);

    const client = catalogClient();
    let tx = client.transaction();
    let touched = 0;

    for (const [productId, qty] of totals) {
        const row = byId.get(productId);
        if (!row || row.stock == null) continue;   // untracked or deleted

        if (direction === -1) {
            // Clamp the amount rather than the result: `dec` has no floor of its
            // own, so a race could otherwise leave negative stock on the shelf.
            tx = tx.patch(productId, (p) => p.dec({ stock: Math.min(qty, row.stock as number) }));
        } else {
            tx = tx.patch(productId, (p) => p.inc({ stock: qty }));
        }
        touched += 1;
    }

    if (touched > 0) await tx.commit();
}

/** Reduces stock for a placed order. */
export const decrementStock = (lines: StockLine[]) => moveStock(lines, -1);

/** Returns stock to the shelf when an order is cancelled. */
export const restoreStock = (lines: StockLine[]) => moveStock(lines, 1);
