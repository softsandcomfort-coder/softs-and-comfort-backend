import "server-only";
import { catalogClient } from "./client";

/**
 * Promo codes.
 *
 * The discount is ALWAYS recomputed here from the stored code. The checkout
 * request may say which code the customer typed, never what it is worth — a
 * client-supplied discount is just a client-supplied price, which is the same
 * reason order totals are recomputed server-side.
 */

export type PromoCode = {
    _id: string;
    code: string;
    discountType: "percent" | "fixed";
    value: number;
    minOrderValue: number | null;
    expiresAt: string | null;
    usageLimit: number | null;
    usedCount: number;
    active: boolean;
    createdAt: string | null;
};

const PROMO_PROJECTION = `{
    _id, code, discountType, value, minOrderValue, expiresAt,
    usageLimit, "usedCount": coalesce(usedCount, 0), active, createdAt
}`;

export async function listPromoCodes(): Promise<PromoCode[]> {
    return catalogClient().fetch(
        `*[_type == "promoCode"] | order(createdAt desc) ${PROMO_PROJECTION}`
    );
}

export async function getPromoCode(id: string): Promise<PromoCode | null> {
    return catalogClient().fetch(
        `*[_type == "promoCode" && _id == $id][0] ${PROMO_PROJECTION}`,
        { id }
    );
}

export type PromoInput = {
    code: string;
    discountType: "percent" | "fixed";
    value: number;
    minOrderValue?: number | null;
    expiresAt?: string | null;
    usageLimit?: number | null;
    active?: boolean;
};

/** Codes are stored upper-cased so matching can be case-insensitive. */
export const normaliseCode = (code: string) => code.trim().toUpperCase();

export async function createPromoCode(input: PromoInput): Promise<{ _id: string }> {
    const code = normaliseCode(input.code);

    const clash = await catalogClient().fetch<string | null>(
        `*[_type == "promoCode" && upper(code) == $code][0]._id`,
        { code }
    );
    if (clash) throw new Error(`The code ${code} already exists`);

    const doc = await catalogClient().create({
        _type: "promoCode",
        code,
        discountType: input.discountType,
        value: input.value,
        minOrderValue: input.minOrderValue ?? null,
        expiresAt: input.expiresAt ?? null,
        usageLimit: input.usageLimit ?? null,
        usedCount: 0,
        active: input.active ?? true,
        createdAt: new Date().toISOString(),
    });
    return { _id: doc._id };
}

export async function updatePromoCode(id: string, input: PromoInput): Promise<void> {
    const code = normaliseCode(input.code);

    const clash = await catalogClient().fetch<string | null>(
        `*[_type == "promoCode" && upper(code) == $code && _id != $id][0]._id`,
        { code, id }
    );
    if (clash) throw new Error(`The code ${code} already exists`);

    await catalogClient()
        .patch(id)
        .set({
            code,
            discountType: input.discountType,
            value: input.value,
            minOrderValue: input.minOrderValue ?? null,
            expiresAt: input.expiresAt ?? null,
            usageLimit: input.usageLimit ?? null,
            active: input.active ?? true,
        })
        .commit();
}

export async function deletePromoCode(id: string): Promise<void> {
    await catalogClient().delete(id);
}

// ─── Redemption ──────────────────────────────────────────────────────────────

export type PromoResult =
    | { ok: true; code: string; discount: number; label: string; promoId: string }
    | { ok: false; reason: string };

/**
 * Validates a code against a subtotal and returns the discount in PKR.
 *
 * Rejection reasons are deliberately specific about *why* (expired, minimum not
 * met) because those are actionable for the customer, but an unknown code just
 * says invalid rather than confirming which codes exist.
 */
export async function validatePromoCode(rawCode: string, subtotal: number): Promise<PromoResult> {
    const code = normaliseCode(rawCode);
    if (!code) return { ok: false, reason: "Enter a promo code" };

    const promo = await catalogClient().fetch<PromoCode | null>(
        `*[_type == "promoCode" && upper(code) == $code][0] ${PROMO_PROJECTION}`,
        { code }
    );

    if (!promo || promo.active === false) {
        return { ok: false, reason: "That code isn't valid" };
    }

    if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) {
        return { ok: false, reason: "That code has expired" };
    }

    if (promo.usageLimit != null && (promo.usedCount ?? 0) >= promo.usageLimit) {
        return { ok: false, reason: "That code has reached its usage limit" };
    }

    if (promo.minOrderValue != null && subtotal < promo.minOrderValue) {
        return {
            ok: false,
            reason: `Spend at least Rs ${promo.minOrderValue.toLocaleString("en-PK")} to use this code`,
        };
    }

    const raw =
        promo.discountType === "percent" ? (subtotal * promo.value) / 100 : promo.value;

    // never discount below zero, and never more than the order is worth
    const discount = Math.max(0, Math.min(Math.round(raw), subtotal));

    return {
        ok: true,
        code: promo.code,
        discount,
        label: promo.discountType === "percent" ? `${promo.value}% off` : `Rs ${promo.value} off`,
        promoId: promo._id,
    };
}

/** Called once an order using the code has actually been created. */
export async function incrementPromoUsage(promoId: string): Promise<void> {
    try {
        await catalogClient().patch(promoId).inc({ usedCount: 1 }).commit();
    } catch (error) {
        // A failed counter must not fail an order that already exists.
        console.error("PROMO_USAGE_INCREMENT_ERROR", promoId, error);
    }
}
