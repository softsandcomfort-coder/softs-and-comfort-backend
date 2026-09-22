import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/session";
import { listAttributes, createAttribute, updateAttribute, deleteAttribute } from "@/lib/sanity/catalog";

async function guard() {
    const session = await requireSession();
    if (!can(session, "products")) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return null;
}

/** The form posts a single `value`; the schema stores a list. Accept both. */
function parseValues(body: Record<string, unknown>): string[] {
    if (Array.isArray(body.values)) return body.values.map(String).filter(Boolean);
    const single = String(body.value || "").trim();
    if (!single) return [];
    // comma-separated is the natural thing to type into one field
    return single.split(",").map((v) => v.trim()).filter(Boolean);
}

export async function GET() {
    const denied = await guard();
    if (denied) return denied;
    try {
        return NextResponse.json({ attributes: await listAttributes() });
    } catch (error) {
        console.error("LIST_ATTRIBUTES_ERROR", error);
        return NextResponse.json({ message: "Could not load attributes" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const body = await req.json();
        const name = String(body.name || "").trim();
        const values = parseValues(body);
        if (!name) return NextResponse.json({ message: "Attribute name is required" }, { status: 400 });
        if (values.length === 0) {
            return NextResponse.json({ message: "At least one value is required" }, { status: 400 });
        }
        const attribute = await createAttribute(name, values);
        return NextResponse.json({ message: "Attribute created", attribute }, { status: 201 });
    } catch (error) {
        console.error("CREATE_ATTRIBUTE_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const body = await req.json();
        const id = String(body.id || "").trim();
        const name = String(body.name || "").trim();
        const values = parseValues(body);
        if (!id || !name) return NextResponse.json({ message: "Id and name are required" }, { status: 400 });
        await updateAttribute(id, name, values);
        return NextResponse.json({ message: "Attribute updated" });
    } catch (error) {
        console.error("UPDATE_ATTRIBUTE_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const id = new URL(req.url).searchParams.get("id");
        if (!id) return NextResponse.json({ message: "Attribute id is required" }, { status: 400 });
        await deleteAttribute(id);
        return NextResponse.json({ message: "Attribute deleted" });
    } catch (error) {
        console.error("DELETE_ATTRIBUTE_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}
