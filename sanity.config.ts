import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'

import { catalogSchemaTypes, adminSchemaTypes } from './src/sanity/schemaTypes'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id'
const catalogDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const adminDataset = process.env.NEXT_PUBLIC_SANITY_ADMIN_DATASET || 'admin'

/**
 * Sanity Studio, embedded in the dashboard at /studio.
 *
 * The dashboard's own forms are the primary way to add products; this is the
 * fallback editor and the place schema validation is defined. Mounting it here
 * rather than in the storefront keeps the ~5MB Studio bundle out of the
 * customer-facing site.
 *
 * Two workspaces over one project:
 *  · catalog → PUBLIC dataset. Products, categories, store settings. The Vite
 *    storefront reads this directly from the browser, so nothing secret goes in.
 *  · admin   → PRIVATE dataset. Login accounts and orders, token-only access.
 */
export default defineConfig([
    {
        name: 'catalog',
        title: 'Velorra — Catalogue',
        basePath: '/studio/catalog',
        projectId,
        dataset: catalogDataset,
        schema: { types: catalogSchemaTypes },
        plugins: [
            structureTool({
                structure: (S) =>
                    S.list()
                        .title('Catalogue')
                        .items([
                            S.listItem()
                                .title('Products')
                                .child(S.documentTypeList('product').title('Products')),
                            S.listItem()
                                .title('Categories')
                                .child(S.documentTypeList('category').title('Categories')),
                            S.listItem()
                                .title('Attributes')
                                .child(S.documentTypeList('attribute').title('Attributes')),
                            S.divider(),
                            // Singleton: always edit the same document id.
                            S.listItem()
                                .title('Store settings')
                                .child(
                                    S.document()
                                        .schemaType('siteSettings')
                                        .documentId('siteSettings')
                                        .title('Store settings')
                                ),
                        ]),
            }),
            visionTool(),
        ],
    },
    {
        name: 'admin',
        title: 'Velorra — Admin data',
        basePath: '/studio/admin-data',
        projectId,
        dataset: adminDataset,
        schema: { types: adminSchemaTypes },
        plugins: [
            structureTool({
                structure: (S) =>
                    S.list()
                        .title('Admin data')
                        .items([
                            S.listItem()
                                .title('Orders')
                                .child(S.documentTypeList('order').title('Orders')),
                            S.listItem()
                                .title('Admin users')
                                .child(S.documentTypeList('adminUser').title('Admin users')),
                        ]),
            }),
            visionTool(),
        ],
    },
])
