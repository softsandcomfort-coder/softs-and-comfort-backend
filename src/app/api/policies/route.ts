import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/session";
import {
    listPolicies,
    savePolicy,
    textToBlocks,
    POLICY_PAGES,
    type PolicySlug,
} from "@/lib/sanity/policies";

async function guard() {
    const session = await requireSession();
    if (!can(session, "settings")) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return null;
}

const VALID_SLUGS = POLICY_PAGES.map((p) => p.slug);

export async function GET() {
    const denied = await guard();
    if (denied) return denied;
    try {
        return NextResponse.json({ policies: await listPolicies() });
    } catch (error) {
        console.error("LIST_POLICIES_ERROR", error);
        return NextResponse.json({ message: "Could not load policies" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const body = await req.json();
        const slug = String(body.slug || "") as PolicySlug;

        if (!VALID_SLUGS.includes(slug)) {
            return NextResponse.json({ message: "Unknown policy page" }, { status: 400 });
        }

        const title = String(body.title || "").trim();
        const text = String(body.text || "").trim();
        const published = body.published === true;

        if (!title) {
            return NextResponse.json({ message: "Give the policy a title" }, { status: 400 });
        }
        // Publishing an empty policy would put a blank legal page on the storefront.
        if (published && !text) {
            return NextResponse.json(
                { message: "Write the policy content before publishing it" },
                { status: 400 }
            );
        }

        await savePolicy({ slug, title, body: textToBlocks(text), published });
        return NextResponse.json({ message: "Policy saved" });
    } catch (error) {
        console.error("SAVE_POLICY_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}
