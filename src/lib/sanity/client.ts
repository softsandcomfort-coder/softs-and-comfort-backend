import "server-only";
import { createClient, type SanityClient } from "@sanity/client";

/**
 * Server-side Sanity clients for the dashboard.
 *
 * `server-only` is imported deliberately: SANITY_API_TOKEN grants write access
 * to the whole project, so importing this module from a client component must
 * fail the build rather than leak the token into the browser bundle.
 *
 * Two clients because there are two datasets:
 *  · catalogClient → public `production` dataset (products, categories, settings)
 *  · adminClient   → private `admin` dataset (login accounts, orders)
 */

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-10-01";
const catalogDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const adminDataset = process.env.NEXT_PUBLIC_SANITY_ADMIN_DATASET || "admin";
const token = process.env.SANITY_API_TOKEN;

export class SanityNotConfiguredError extends Error {
    constructor() {
        super(
            "Sanity is not configured. Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN in .env.local"
        );
        this.name = "SanityNotConfiguredError";
    }
}

export const isSanityConfigured = Boolean(projectId && token);

function build(dataset: string): SanityClient {
    if (!projectId || !token) throw new SanityNotConfiguredError();
    return createClient({
        projectId,
        dataset,
        token,
        apiVersion,
        // never CDN: the dashboard must read its own writes immediately
        useCdn: false,
        perspective: "raw",
    });
}

let _catalog: SanityClient | null = null;
let _admin: SanityClient | null = null;

/** Public catalogue dataset — products, categories, attributes, store settings. */
export function catalogClient(): SanityClient {
    if (!_catalog) _catalog = build(catalogDataset);
    return _catalog;
}

/** Private dataset — admin accounts, password reset tokens, orders. */
export function adminClient(): SanityClient {
    if (!_admin) _admin = build(adminDataset);
    return _admin;
}

export const sanityDatasets = { catalog: catalogDataset, admin: adminDataset };
