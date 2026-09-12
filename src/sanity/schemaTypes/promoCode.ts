import { defineField, defineType } from 'sanity'

/**
 * Discount codes redeemed at checkout.
 *
 * Lives in the PUBLIC catalogue dataset, which means anyone can in principle
 * read the list of codes. That is acceptable because a promo code is not a
 * secret — it is a coupon. What must never be client-controlled is the
 * *discount applied*: the checkout endpoint re-reads the code server-side and
 * recomputes the total, exactly as it already does for prices.
 */
export const promoCode = defineType({
    name: 'promoCode',
    title: 'Promo code',
    type: 'document',
    fields: [
        defineField({
            name: 'code',
            title: 'Code',
            type: 'string',
            description: 'What the customer types at checkout. Matched case-insensitively.',
            validation: (Rule) =>
                Rule.required()
                    .uppercase()
                    .regex(/^[A-Z0-9-]{3,24}$/, { name: 'promo code' })
                    .error('3-24 characters: letters, numbers and hyphens only'),
        }),
        defineField({
            name: 'discountType',
            title: 'Discount type',
            type: 'string',
            options: {
                list: [
                    { title: 'Percentage off', value: 'percent' },
                    { title: 'Fixed amount off', value: 'fixed' },
                ],
                layout: 'radio',
            },
            initialValue: 'percent',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'value',
            title: 'Value',
            type: 'number',
            description: 'Percentage (1-100) or a fixed amount in PKR, depending on the type above.',
            validation: (Rule) =>
                Rule.required()
                    .positive()
                    .custom((value, context) => {
                        const doc = context.document as { discountType?: string } | undefined
                        if (doc?.discountType === 'percent' && (value ?? 0) > 100) {
                            return 'A percentage discount cannot exceed 100'
                        }
                        return true
                    }),
        }),
        defineField({
            name: 'minOrderValue',
            title: 'Minimum order value',
            type: 'number',
            description: 'Order subtotal required before this code applies. Leave empty for no minimum.',
            validation: (Rule) => Rule.min(0),
        }),
        defineField({
            name: 'expiresAt',
            title: 'Expires at',
            type: 'datetime',
            description: 'Leave empty for a code that never expires.',
        }),
        defineField({
            name: 'usageLimit',
            title: 'Usage limit',
            type: 'number',
            description: 'Total number of times this code may be redeemed. Leave empty for unlimited.',
            validation: (Rule) => Rule.min(1).integer(),
        }),
        defineField({
            name: 'usedCount',
            title: 'Times used',
            type: 'number',
            readOnly: true,
            initialValue: 0,
        }),
        defineField({
            name: 'active',
            title: 'Active',
            type: 'boolean',
            description: 'Turn off to disable the code without deleting it.',
            initialValue: true,
        }),
        defineField({
            name: 'createdAt',
            title: 'Created at',
            type: 'datetime',
            readOnly: true,
            initialValue: () => new Date().toISOString(),
        }),
    ],
    orderings: [
        { title: 'Newest first', name: 'createdAtDesc', by: [{ field: 'createdAt', direction: 'desc' }] },
    ],
    preview: {
        select: {
            title: 'code',
            discountType: 'discountType',
            value: 'value',
            active: 'active',
            usedCount: 'usedCount',
        },
        prepare({ title, discountType, value, active, usedCount }) {
            const amount = discountType === 'percent' ? `${value}% off` : `Rs ${value} off`
            return {
                title: `${title}${active === false ? ' (inactive)' : ''}`,
                subtitle: `${amount} · used ${usedCount ?? 0}×`,
            }
        },
    },
})
