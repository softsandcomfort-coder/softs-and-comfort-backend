/** @type {import('next').NextConfig} */
const nextConfig = {
    /**
     * Sanity Studio is embedded at /studio. Bundling `sanity` into the React
     * Server Components graph breaks the production build: it pulls in swr's
     * `react-server` entry point, which has no default export, and the build
     * fails with "The export default was not found in module swr".
     *
     * Marking it external keeps it out of the RSC compilation and lets Node
     * resolve it normally at runtime. The dev server happened to work without
     * this; only `next build` surfaced it.
     */
    serverExternalPackages: ["sanity", "@sanity/vision"],

    images: {
        remotePatterns: [
            // product and category images are served from Sanity's asset CDN
            { protocol: "https", hostname: "cdn.sanity.io" },
        ],
    },
};

export default nextConfig;
