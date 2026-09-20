import type { SchemaTypeDefinition } from 'sanity'

import { category } from './category'
import { product } from './product'
import { productColor } from './productColor'
import { siteSettings, attribute } from './settings'
import { promoCode } from './promoCode'
import { policy } from './policy'
import { review } from './review'
import { adminUser, passwordResetToken } from './adminUser'
import { order, orderObjects } from './order'

/**
 * The catalogue lives in the PUBLIC dataset — the storefront is a static SPA
 * and reads it straight from the browser, so anything in here is world
 * readable by design.
 */
export const catalogSchemaTypes: SchemaTypeDefinition[] = [
    product,
    category,
    productColor,
    attribute,
    siteSettings,
    promoCode,
    policy,
    review,
]

/**
 * The admin dataset is PRIVATE and only ever reached with a server-side token:
 * password hashes and customer PII must never be publicly readable.
 */
export const adminSchemaTypes: SchemaTypeDefinition[] = [
    adminUser,
    passwordResetToken,
    order,
    ...orderObjects,
]

export {
    promoCode,
    policy,
    review,
    product,
    category,
    productColor,
    attribute,
    siteSettings,
    adminUser,
    passwordResetToken,
    order,
}
