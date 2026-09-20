import { defineField, defineType } from 'sanity'

/**
 * Customer reviews shown on the storefront.
 *
 * Lives in the PUBLIC catalogue dataset because the storefront reads it from
 * the browser with no token — so it must never carry anything the customer
 * would not expect on a public page. Only a display name and, optionally, a
 * city: no phone, email or address, the same rule the recent-purchases feed
 * follows.
 *
 * Nothing is seeded. A review exists only because the owner entered words a
 * real customer said; an empty list simply hides the section.
 */
export const review = defineType({
    name: 'review',
    title: 'Review',
    type: 'document',
    fields: [
        defineField({
            name: 'customerName',
            title: 'Customer name',
            type: 'string',
            description: 'As it should appear publicly — a first name and initial is plenty.',
            validation: (Rule) => Rule.required().max(60),
        }),
        defineField({
            name: 'city',
            title: 'City',
            type: 'string',
            description: 'Optional. Shown next to the name, e.g. Lahore.',
            validation: (Rule) => Rule.max(60),
        }),
        defineField({
            name: 'rating',
            title: 'Rating',
            type: 'number',
            description: 'Out of 5.',
            initialValue: 5,
            validation: (Rule) => Rule.required().min(1).max(5).integer(),
        }),
        defineField({
            name: 'quote',
            title: 'What they said',
            type: 'text',
            rows: 4,
            description: 'The customer’s own words. Do not write these yourself.',
            validation: (Rule) => Rule.required().min(10).max(600),
        }),
        defineField({
            name: 'product',
            title: 'Product',
            type: 'reference',
            to: [{ type: 'product' }],
            description: 'Optional — which product the review is about.',
        }),
        defineField({
            name: 'published',
            title: 'Published',
            type: 'boolean',
            description: 'Only published reviews appear on the storefront.',
            initialValue: true,
        }),
        defineField({
            name: 'createdAt',
            title: 'Received',
            type: 'datetime',
        }),
    ],
    preview: {
        select: { title: 'customerName', subtitle: 'quote', rating: 'rating' },
        prepare({ title, subtitle, rating }) {
            return {
                title: `${title} — ${rating}/5`,
                subtitle: subtitle?.slice(0, 80),
            }
        },
    },
})
