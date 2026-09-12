/**
 * Pushes Soft & Comfort's ten categories into the public catalogue dataset.
 *
 *   node scripts/seed-categories.mjs
 *
 * Safe to re-run: documents use deterministic ids (`category-<slug>`), so a
 * second run updates rather than duplicates.
 *
 * Categories only — no products are created by this script.
 */
import { createClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_TOKEN

if (!projectId || !token) {
    console.error('\n  ✗ NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN must be set in .env\n')
    process.exit(1)
}

const client = createClient({ projectId, dataset, token, apiVersion: '2024-10-01', useCdn: false })

/** Mirrors CategoryData in Frontend-website/src/constant/Alldata.tsx. */
const CATEGORIES = [
    { name: 'Bras', group: 'women' },
    { name: 'Panties', group: 'women' },
    { name: 'Lingerie Sets', group: 'women' },
    { name: 'Camisoles & Tops', group: 'women' },
    { name: 'Sleepwear', group: 'women' },
    { name: 'Briefs', group: 'men' },
    { name: 'Boxers', group: 'men' },
    { name: 'Vests & Undershirts', group: 'men' },
    { name: 'Socks', group: 'unisex' },
    { name: 'Thermals', group: 'unisex' },
]

const slugify = (value) =>
    value
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

const tx = CATEGORIES.reduce((transaction, cat, index) => {
    const slug = slugify(cat.name)
    return transaction.createOrReplace({
        _id: `category-${slug}`,
        _type: 'category',
        name: cat.name,
        slug: { _type: 'slug', current: slug },
        group: cat.group,
        displayOrder: (index + 1) * 10,
    })
}, client.transaction())

await tx.commit()

console.log(`\n  ✓ Seeded ${CATEGORIES.length} categories into "${dataset}"\n`)
CATEGORIES.forEach((c) => console.log(`     · ${c.name} (${c.group})`))
console.log('')
