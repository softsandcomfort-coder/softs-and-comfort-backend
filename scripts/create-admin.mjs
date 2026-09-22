/**
 * Creates (or resets the password of) a dashboard login account.
 *
 * This is the bootstrap step: you cannot create the first admin through the
 * dashboard, because signing in requires an account to already exist.
 *
 *   node scripts/create-admin.mjs owner@softandcomfort.com 'a-strong-password' 'Full Name'
 *
 * Reads .env.local by default. Pass --env <file> to target another project,
 * e.g. the live one:  npm run create:admin:prod -- <email> <password> [name]
 *
 * Requires SANITY_API_TOKEN with Editor rights on the PRIVATE admin dataset.
 */
import { createClient } from '@sanity/client'
import bcrypt from 'bcryptjs'
import { config as loadEnv } from 'dotenv'

const args = process.argv.slice(2)
const envFlag = args.indexOf('--env')
const envFile = envFlag === -1 ? '.env.local' : args.splice(envFlag, 2)[1]

loadEnv({ path: envFile, quiet: true })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_ADMIN_DATASET || 'admin'
const token = process.env.SANITY_API_TOKEN

const [email, password, name = 'Store Owner'] = args

function fail(message) {
    console.error(`\n  ✗ ${message}\n`)
    process.exit(1)
}

if (!projectId) fail('NEXT_PUBLIC_SANITY_PROJECT_ID is not set. Copy .env.example to .env first.')
if (!token) fail('SANITY_API_TOKEN is not set. Create one at sanity.io/manage → API → Tokens (Editor).')
if (!email || !password) {
    fail("Usage: node scripts/create-admin.mjs <email> <password> [name]")
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(`"${email}" is not a valid email address.`)
if (password.length < 8) fail('Password must be at least 8 characters.')

console.log(`
  Using ${envFile} → project ${projectId}, dataset ${dataset}`)

const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: '2024-10-01',
    useCdn: false,
})

const normalisedEmail = email.trim().toLowerCase()
const passwordHash = await bcrypt.hash(password, 12)

const existing = await client
    .fetch('*[_type == "adminUser" && email == $email][0]{_id, name}', {
        email: normalisedEmail,
    })
    .catch((err) => {
        if (err.statusCode === 404) {
            fail(`Dataset "${dataset}" does not exist in project ${projectId}.
    Create it at sanity.io/manage → ${projectId} → Datasets → Add dataset (visibility: Private), then run this again.`)
        }
        throw err
    })

if (existing) {
    await client.patch(existing._id).set({ passwordHash, active: true }).commit()
    console.log(`\n  ✓ Password reset for existing account ${normalisedEmail}\n`)
} else {
    const doc = await client.create({
        _type: 'adminUser',
        name,
        email: normalisedEmail,
        passwordHash,
        role: 'owner',
        permissions: ['products', 'categories', 'orders', 'users', 'settings'],
        active: true,
        createdAt: new Date().toISOString(),
    })
    console.log(`\n  ✓ Created owner account ${normalisedEmail} (${doc._id})\n`)
}

console.log(`  You can now sign in at ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login\n`)
