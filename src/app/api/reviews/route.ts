import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/session";
import {
    listReviews,
    createReview,
    updateReview,
    deleteReview,
    type ReviewInput,
} from "@/lib/sanity/reviews";

async function guard() {
    const session = await getSession();
    if (!can(session, "products")) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return null;
}

function parseBody(body: Record<string, unknown>): ReviewInput | { error: string } {
    const customerName = String(body.customerName || "").trim();
    if (customerName.length < 2 || customerName.length > 60) {
        return { error: "Enter the customer's name (2-60 characters)" };
    }

    const quote = String(body.quote || "").trim();
    if (quote.length < 10 || quote.length > 600) {
        return { error: "The review should be between 10 and 600 characters" };
    }

    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return { error: "Rating must be a whole number from 1 to 5" };
    }

    const city = body.city ? String(body.city).trim().slice(0, 60) : null;
    const productId = body.productId ? String(body.productId) : null;

    return { customerName, city, rating, quote, productId, published: body.published !== false };
}

export async function GET() {
    const denied = await guard();
    if (denied) return denied;
    try {
        return NextResponse.json({ reviews: await listReviews() });
    } catch (error) {
        console.error("LIST_REVIEWS_ERROR", error);
        return NextResponse.json({ message: "Could not load reviews" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const parsed = parseBody(await req.json());
        if ("error" in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });

        const created = await createReview(parsed);
        return NextResponse.json({ message: "Review added", id: created._id }, { status: 201 });
    } catch (error) {
        console.error("CREATE_REVIEW_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const body = await req.json();
        const id = String(body.id || "").trim();
        if (!id) return NextResponse.json({ message: "Review id is required" }, { status: 400 });

        const parsed = parseBody(body);
        if ("error" in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });

        await updateReview(id, parsed);
        return NextResponse.json({ message: "Review updated" });
    } catch (error) {
        console.error("UPDATE_REVIEW_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ message: "Review id is required" }, { status: 400 });

        await deleteReview(String(id));
        return NextResponse.json({ message: "Review deleted" });
    } catch (error) {
        console.error("DELETE_REVIEW_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}
