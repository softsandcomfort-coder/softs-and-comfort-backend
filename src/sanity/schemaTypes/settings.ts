import { defineField, defineType } from 'sanity'

/** Singleton — one document with the fixed id `siteSettings`. */
export const siteSettings = defineType({
    name: 'siteSettings',
    title: 'Store settings',
    type: 'document',
    fields: [
        defineField({ name: 'storeName', title: 'Store name', type: 'string', initialValue: 'Soft & Comfort' }),
        defineField({ name: 'tagline', title: 'Tagline', type: 'string' }),
        defineField({ name: 'supportEmail', title: 'Support email', type: 'string' }),
        defineField({ name: 'phone', title: 'Phone', type: 'string' }),
        defineField({ name: 'address', title: 'Address', type: 'text', rows: 3 }),
        defineField({
            name: 'whatsappNumber',
            title: 'WhatsApp number',
            type: 'string',
            description: 'International format without + or spaces, e.g. 923001234567. Used for every contact link on the storefront.',
            validation: (Rule) =>
                Rule.regex(/^[0-9]{8,15}$/, { name: 'whatsapp number' }).warning(
                    'Digits only, including the country code — no +, spaces or dashes'
                ),
        }),
        defineField({ name: 'currency', title: 'Currency code', type: 'string', initialValue: 'PKR' }),
        defineField({ name: 'currencySymbol', title: 'Currency symbol', type: 'string', initialValue: 'Rs' }),
        defineField({
            name: 'freeShippingThreshold',
            title: 'Free shipping over',
            type: 'number',
            description: 'Order subtotal above which shipping is free. Leave empty to disable.',
        }),
        defineField({ name: 'shippingFlatRate', title: 'Flat shipping rate', type: 'number', initialValue: 0 }),
        defineField({
            name: 'social',
            title: 'Social links',
            type: 'object',
            fields: [
                defineField({ name: 'facebook', title: 'Facebook', type: 'url' }),
                defineField({ name: 'instagram', title: 'Instagram', type: 'url' }),
                defineField({ name: 'tiktok', title: 'TikTok', type: 'url' }),
                defineField({ name: 'youtube', title: 'YouTube', type: 'url' }),
            ],
        }),
    ],
    preview: {
        select: { title: 'storeName' },
        prepare: ({ title }) => ({ title: (title as string) || 'Store settings' }),
    },
})

/** Reusable attribute sets (fabric, fit, …) used to populate product tag lists. */
export const attribute = defineType({
    name: 'attribute',
    title: 'Attribute',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'values',
            title: 'Values',
            type: 'array',
            of: [{ type: 'string' }],
            options: { layout: 'tags' },
            validation: (Rule) => Rule.min(1),
        }),
    ],
    preview: {
        select: { title: 'name', values: 'values' },
        prepare: ({ title, values }) => ({
            title: title as string,
            subtitle: Array.isArray(values) ? values.join(', ') : '',
        }),
    },
})
