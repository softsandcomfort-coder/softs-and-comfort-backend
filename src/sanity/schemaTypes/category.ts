import { defineField, defineType } from 'sanity'

/**
 * Storefront categories. The `name` must stay in sync with the names the
 * storefront filters on (`?category=<name>`), so it is the join key between
 * Sanity and the existing URL convention.
 */
export const category = defineType({
    name: 'category',
    title: 'Category',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            description: 'Shown in navigation and used in /shop?category=<name>',
            validation: (Rule) => Rule.required().max(60),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'name', maxLength: 60 },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'group',
            title: 'Audience',
            type: 'string',
            options: {
                list: [
                    { title: 'Women', value: 'women' },
                    { title: 'Men', value: 'men' },
                    { title: 'Unisex', value: 'unisex' },
                ],
                layout: 'radio',
            },
            initialValue: 'women',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'image',
            title: 'Category image',
            type: 'image',
            options: { hotspot: true },
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'displayOrder',
            title: 'Display order',
            type: 'number',
            description: 'Lower numbers appear first in the navigation.',
            initialValue: 100,
        }),
    ],
    orderings: [
        {
            title: 'Display order',
            name: 'displayOrderAsc',
            by: [{ field: 'displayOrder', direction: 'asc' }],
        },
    ],
    preview: {
        select: { title: 'name', subtitle: 'group', media: 'image' },
    },
})
