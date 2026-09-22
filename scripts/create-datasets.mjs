/**
 * Creates the two datasets a fresh Sanity project needs:
 *   production — PUBLIC  (catalogue the storefront reads without a token)
 *   admin      — PRIVATE (admin logins and orders)
 *
 *   npm run create:datasets:prod          (uses .env.production)
 *   node scripts/create-datasets.mjs      (uses .env.local)
 *
 * Needs a token with Administrator (or Deploy Studio) rights. An Editor token
 * can read and write documents but cannot create datasets.
 */
import { config as loadEnv } from 'dotenv'

const args = process.argv.slice(2)
const envFlag = args.indexOf('--env')
const envFile = envFlag === -1 ? '.env.local' : args[envFlag + 1]

loadEnv({ path: envFile, quiet: true })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const token = process.env.SANITY_API_TOKEN
const wanted = [
    { name: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production', aclMode: 'public' },
    { name: process.env.NEXT_PUBLIC_SANITY_ADMIN_DATASET || 'admin', aclMode: 'private' },
]

if (!projectId || !token) {
    console.error(`\n  ✗ ${envFile} needs NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN.\n`)
    process.exitCode = 1
} else {
    console.log(`\n  Using ${envFile} → project ${projectId}\n`)
    const base = `https://api.sanity.io/v2021-06-07/projects/${projectId}/datasets`
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

    const listRes = await fetch(base, { headers })
    if (!listRes.ok) {
        console.error(`  ✗ Could not list datasets (${listRes.status}). ${await listRes.text()}`)
        console.error('    The token needs Administrator rights — or create the datasets by hand at sanity.io/manage.\n')
        process.exitCode = 1
    } else {
        const existing = new Map((await listRes.json()).map((d) => [d.name, d.aclMode]))

        for (const { name, aclMode } of wanted) {
            if (existing.has(name)) {
                const mode = existing.get(name)
                const note = mode === aclMode ? '' : `  ⚠ should be ${aclMode} — change it in sanity.io/manage`
                console.log(`  • ${name} already exists (${mode})${note}`)
                continue
            }
            const res = await fetch(`${base}/${name}`, { method: 'PUT', headers, body: JSON.stringify({ aclMode }) })
            if (res.ok) {
                console.log(`  ✓ Created ${name} (${aclMode})`)
            } else {
                console.error(`  ✗ Could not create ${name} (${res.status}). ${await res.text()}`)
                process.exitCode = 1
            }
        }

        if (process.exitCode === 1) {
            console.error('\n    The token needs Administrator rights to create datasets.')
            console.error('    Either make an Administrator token, or add them by hand: sanity.io/manage → Datasets.\n')
        } else {
            console.log('\n  Done. Now run: npm run create:admin:prod -- <email> <password> [name]\n')
        }
    }
}
