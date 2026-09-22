import type { MetadataRoute } from "next";

// admin.softandcomfort.com is private — tell crawlers to stay out entirely.
export default function robots(): MetadataRoute.Robots {
    return { rules: { userAgent: "*", disallow: "/" } };
}
