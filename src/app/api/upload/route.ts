import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/session";
import { uploadImage } from "@/lib/sanity/catalog";

/** Sanity's own limit is far higher, but nothing in this dashboard needs more. */
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export async function POST(req: Request) {
    const session = await requireSession();
    if (!can(session, "products")) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    try {
        const form = await req.formData();
        const files = form.getAll("file").filter((f): f is File => f instanceof File);

        if (files.length === 0) {
            return NextResponse.json({ message: "No file provided" }, { status: 400 });
        }
        for (const file of files) {
            if (!ALLOWED.includes(file.type)) {
                return NextResponse.json(
                    { message: `${file.name}: unsupported type ${file.type || "unknown"}` },
                    { status: 400 }
                );
            }
            if (file.size > MAX_BYTES) {
                return NextResponse.json(
                    { message: `${file.name} is larger than 10MB` },
                    { status: 413 }
                );
            }
        }

        const assets = await Promise.all(files.map(uploadImage));
        return NextResponse.json({ message: "Uploaded", assets }, { status: 201 });
    } catch (error) {
        console.error("UPLOAD_ERROR", error);
        return NextResponse.json({ message: "Upload failed" }, { status: 500 });
    }
}
