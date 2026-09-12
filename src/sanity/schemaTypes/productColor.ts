import { defineField, defineType } from 'sanity'

/**
 * A named colourway. The storefront filters on `hex`, so the query projects
 * `colors[].hex` down to a plain string array; the name exists so the Studio
 * is editable by a human rather than by hex code.
 */
export const productColor = defineType({
    name: 'productColor',
    title: 'Colour',
    type: 'object',
    fields: [
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            validation: (Rule) => Rule.required().max(40),
        }),
        defineField({
            name: 'hex',
            title: 'Hex value',
            type: 'string',
            description: 'e.g. #FF4A76 — this is what the shop filter matches on.',
            validation: (Rule) =>
                Rule.required()
                    .regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex colour' })
                    .error('Must be a 6-digit hex colour such as #FF4A76'),
        }),
    ],
    preview: {
        select: { title: 'name', subtitle: 'hex' },
    },
})
