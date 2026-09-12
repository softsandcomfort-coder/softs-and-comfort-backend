import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/session";
import { listCategories, createCategory, updateCategory, deleteCategory } from "@/lib/sanity/catalog";

async function guard() {
    const session = await getSession();
    if (!can(session, "categories")) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return null;
}

export async function GET() {
    const denied = await guard();
    if (denied) return denied;
    try {
        return NextResponse.json({ categories: await listCategories() });
    } catch (error) {
        console.error("LIST_CATEGORIES_ERROR", error);
        return NextResponse.json({ message: "Could not load categories" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const body = await req.json();
        const name = String(body.name || "").trim();
        if (!name) return NextResponse.json({ message: "Category name is required" }, { status: 400 });

        const category = await createCategory({
            name,
            group: body.group ? String(body.group) : "women",
            description: body.description ? String(body.description) : null,
            imageAssetId: body.imageAssetId ? String(body.imageAssetId) : null,
        });
        return NextResponse.json({ message: "Category created", category }, { status: 201 });
    } catch (error) {
        console.error("CREATE_CATEGORY_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const body = await req.json();
        const id = String(body.id || "").trim();
        if (!id) return NextResponse.json({ message: "Category id is required" }, { status: 400 });

        await updateCategory(id, {
            name: body.name ? String(body.name) : undefined,
            group: body.group ? String(body.group) : undefined,
            description: body.description !== undefined ? String(body.description ?? "") : undefined,
            imageAssetId: body.imageAssetId ? String(body.imageAssetId) : null,
        });
        return NextResponse.json({ message: "Category updated" });
    } catch (error) {
        console.error("UPDATE_CATEGORY_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const denied = await guard();
    if (denied) return denied;
    try {
        const id = new URL(req.url).searchParams.get("id");
        if (!id) return NextResponse.json({ message: "Category id is required" }, { status: 400 });

        const result = await deleteCategory(id);
        if (!result.ok) {
            // deleting it would leave those products pointing at nothing
            return NextResponse.json(
                {
                    message: `This category still has ${result.productCount} product(s). Move or delete them first.`,
                },
                { status: 409 }
            );
        }
        return NextResponse.json({ message: "Category deleted" });
    } catch (error) {
        console.error("DELETE_CATEGORY_ERROR", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}
