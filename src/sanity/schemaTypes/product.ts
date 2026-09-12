import { defineField, defineType } from 'sanity'

/** Sizes offered across the catalogue. Kept as strings so letter and numeric
 *  sizing can coexist (bras use numeric bands, briefs use S/M/L). */
export const SIZE_OPTIONS = [
    'XS', 'S', 'M', 'L', 'XL', 'XXL',
    '4', '6', '8', '10', '12', '14', '16', '18', '20',
]

export const product = defineType({
    name: 'product',
    title: 'Product',
    type: 'document',
    groups: [
        { name: 'content', title: 'Content', default: true },
        { name: 'pricing', title: 'Pricing & stock' },
        { name: 'variants', title: 'Variants' },
    ],
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            group: 'content',
            validation: (Rule) => Rule.required().max(120),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            group: 'content',
            description: 'Used in the product URL: /product/<slug>',
            options: { source: 'title', maxLength: 96 },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'category',
            title: 'Category',
            type: 'reference',
            group: 'content',
            to: [{ type: 'category' }],
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'images',
            title: 'Images',
            type: 'array',
            group: 'content',
            of: [{ type: 'image', options: { hotspot: true } }],
            description: 'The first image is used as the product card thumbnail.',
            validation: (Rule) => Rule.min(1).error('Add at least one product photo'),
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
            group: 'content',
            rows: 5,
        }),
        defineField({
            name: 'price',
            title: 'Price (PKR)',
            type: 'number',
            group: 'pricing',
            validation: (Rule) => Rule.required().min(0),
        }),
        defineField({
            name: 'salePrice',
            title: 'Sale price (PKR)',
            type: 'number',
            group: 'pricing',
            description: 'Leave empty when the product is not discounted.',
            validation: (Rule) =>
                Rule.min(0).custom((salePrice, context) => {
                    const price = (context.document as { price?: number } | undefined)?.price
                    if (salePrice == null || price == null) return true
                    return salePrice < price || 'Sale price must be lower than the regular price'
                }),
        }),
        defineField({
            name: 'sku',
            title: 'SKU',
            type: 'string',
            group: 'pricing',
        }),
        defineField({
            name: 'brand',
            title: 'Brand',
            type: 'string',
            group: 'pricing',
            initialValue: 'Soft & Comfort',
        }),
        defineField({
            name: 'stock',
            title: 'Stock on hand',
            type: 'number',
            group: 'pricing',
            initialValue: 0,
            validation: (Rule) => Rule.min(0).integer(),
        }),
        defineField({
            name: 'colors',
            title: 'Colours',
            type: 'array',
            group: 'variants',
            of: [{ type: 'productColor' }],
        }),
        defineField({
            name: 'sizes',
            title: 'Sizes',
            type: 'array',
            group: 'variants',
            of: [{ type: 'string' }],
            options: { list: SIZE_OPTIONS.map((s) => ({ title: s, value: s })) },
        }),
        defineField({
            name: 'tags',
            title: 'Tags',
            type: 'array',
            group: 'variants',
            of: [{ type: 'string' }],
            description: 'Fabric and fit tags shown in the shop sidebar, e.g. Cotton, Seamless.',
            options: { layout: 'tags' },
        }),
        defineField({
            name: 'rating',
            title: 'Rating',
            type: 'number',
            group: 'content',
            initialValue: 5,
            validation: (Rule) => Rule.min(0).max(5),
        }),
        defineField({
            name: 'featured',
            title: 'Featured on homepage',
            type: 'boolean',
            group: 'content',
            initialValue: false,
        }),
        defineField({
            name: 'publishedAt',
            title: 'Published at',
            type: 'datetime',
            group: 'content',
            initialValue: () => new Date().toISOString(),
        }),
    ],
    orderings: [
        {
            title: 'Newest first',
            name: 'publishedAtDesc',
            by: [{ field: 'publishedAt', direction: 'desc' }],
        },
        {
            title: 'Price, low to high',
            name: 'priceAsc',
            by: [{ field: 'price', direction: 'asc' }],
        },
    ],
    preview: {
        select: { title: 'title', category: 'category.name', price: 'price', media: 'images.0' },
        prepare({ title, category, price, media }) {
            return {
                title,
                subtitle: [category, price != null ? `Rs ${price}` : null].filter(Boolean).join(' · '),
                media,
            }
        },
    },
})
