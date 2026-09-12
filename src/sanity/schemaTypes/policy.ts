import { defineField, defineType } from 'sanity'

/**
 * Customer-facing policy pages, rendered on the storefront.
 *
 * Deliberately NOT pre-filled with boilerplate. The template shipped an invented
 * privacy policy claiming the store ran on Shopify and Google Analytics, and
 * terms written for a different company in a different jurisdiction — text like
 * that is worse than no text, because it is a legal statement that is simply
 * untrue. The owner writes these; until they do, the storefront says the policy
 * is not published yet rather than inventing one.
 */

export const POLICY_SLUGS = [
    { title: 'Privacy Policy', value: 'privacy' },
    { title: 'Terms & Conditions', value: 'terms' },
    { title: 'Shipping Policy', value: 'shipping' },
    { title: 'Returns & Exchanges', value: 'returns' },
] as const

export const policy = defineType({
    name: 'policy',
    title: 'Policy',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            description: 'Shown as the page heading and in the footer link.',
            validation: (Rule) => Rule.required().max(80),
        }),
        defineField({
            name: 'slug',
            title: 'Page',
            type: 'string',
            description: 'Which policy page this is. Each one should exist only once.',
            options: { list: [...POLICY_SLUGS], layout: 'radio' },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'body',
            title: 'Content',
            type: 'array',
            of: [
                {
                    type: 'block',
                    styles: [
                        { title: 'Normal', value: 'normal' },
                        { title: 'Heading', value: 'h3' },
                        { title: 'Sub-heading', value: 'h4' },
                    ],
                    lists: [
                        { title: 'Bullet', value: 'bullet' },
                        { title: 'Numbered', value: 'number' },
                    ],
                    marks: {
                        decorators: [
                            { title: 'Bold', value: 'strong' },
                            { title: 'Italic', value: 'em' },
                        ],
                    },
                },
            ],
            validation: (Rule) => Rule.required().min(1).error('Write the policy content before publishing'),
        }),
        defineField({
            name: 'published',
            title: 'Published',
            type: 'boolean',
            description: 'Off until the text is ready. Unpublished policies are not shown on the storefront.',
            initialValue: false,
        }),
        defineField({
            name: 'updatedAt',
            title: 'Last updated',
            type: 'datetime',
            description: 'Shown to customers so they can see when the policy last changed.',
            initialValue: () => new Date().toISOString(),
        }),
    ],
    orderings: [{ title: 'Page', name: 'slugAsc', by: [{ field: 'slug', direction: 'asc' }] }],
    preview: {
        select: { title: 'title', slug: 'slug', published: 'published' },
        prepare({ title, slug, published }) {
            return {
                title: title as string,
                subtitle: `/${slug}${published ? '' : ' — not published'}`,
            }
        },
    },
})
