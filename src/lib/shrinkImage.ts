/**
 * Shrinks a photo in the browser before it is uploaded.
 *
 * Vercel rejects any request body over 4.5 MB before it reaches our route, and
 * a single phone photo can be larger than that. Product photos never need more
 * than 2000px on the long edge (Sanity resizes on delivery anyway), so anything
 * bigger than 1 MB is redrawn at that size as WebP, which also keeps
 * transparency. Small files and GIFs are sent untouched.
 */
const MAX_EDGE = 2000;
const SHRINK_ABOVE = 1024 * 1024;

export async function shrinkImage(file: File): Promise<File> {
    if (file.size <= SHRINK_ABOVE || file.type === "image/gif") return file;

    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/webp", 0.85)
        );
        if (!blob || blob.size >= file.size) return file;

        const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
        return new File([blob], name, { type: "image/webp" });
    } catch {
        // an image the browser cannot decode — let the server report it
        return file;
    }
}
