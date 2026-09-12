import { defineField, defineType } from 'sanity'

/**
 * PRIVATE `admin` dataset only — orders carry customer PII and must never be
 * served from the public, CDN-cached catalogue dataset.
 *
 * Line items snapshot the title/price at purchase time on purpose: editing a
 * product later must not rewrite the history of an order already placed.
 */
const orderLine = defineType({
    name: 'orderLine',
    title: 'Order line',
    type: 'object',
    fields: [
        defineField({ name: 'productId', title: 'Product id', type: 'string' }),
        defineField({ name: 'title', title: 'Title', type: 'string' }),
        defineField({ name: 'image', title: 'Image URL', type: 'url' }),
        defineField({ name: 'unitPrice', title: 'Unit price', type: 'number' }),
        defineField({ name: 'qty', title: 'Quantity', type: 'number' }),
        defineField({ name: 'size', title: 'Size', type: 'string' }),
        defineField({ name: 'color', title: 'Colour', type: 'string' }),
    ],
    preview: {
        select: { title: 'title', qty: 'qty', unitPrice: 'unitPrice' },
        prepare: ({ title, qty, unitPrice }) => ({
            title: title as string,
            subtitle: `${qty} x Rs ${unitPrice}`,
        }),
    },
})

const shippingAddress = defineType({
    name: 'shippingAddress',
    title: 'Address',
    type: 'object',
    fields: [
        defineField({ name: 'line1', title: 'Address line 1', type: 'string' }),
        defineField({ name: 'line2', title: 'Address line 2', type: 'string' }),
        defineField({ name: 'city', title: 'City', type: 'string' }),
        defineField({ name: 'state', title: 'State / Province', type: 'string' }),
        defineField({ name: 'postcode', title: 'Postcode', type: 'string' }),
        defineField({ name: 'country', title: 'Country', type: 'string', initialValue: 'Pakistan' }),
    ],
})

export const ORDER_STATUSES = [
    { title: 'Pending', value: 'pending' },
    { title: 'Confirmed', value: 'confirmed' },
    { title: 'Shipped', value: 'shipped' },
    { title: 'Delivered', value: 'delivered' },
    { title: 'Cancelled', value: 'cancelled' },
]

export const order = defineType({
    name: 'order',
    title: 'Order',
    type: 'document',
    fields: [
        defineField({
            name: 'orderNumber',
            title: 'Order number',
            type: 'string',
            readOnly: true,
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'status',
            title: 'Status',
            type: 'string',
            options: { list: ORDER_STATUSES },
            initialValue: 'pending',
            validation: (Rule) => Rule.required(),
        }),
        defineField({ name: 'customerName', title: 'Customer name', type: 'string' }),
        defineField({ name: 'customerEmail', title: 'Customer email', type: 'string' }),
        defineField({ name: 'customerPhone', title: 'Customer phone', type: 'string' }),
        defineField({ name: 'shippingAddress', title: 'Shipping address', type: 'shippingAddress' }),
        defineField({ name: 'notes', title: 'Order notes', type: 'text', rows: 3 }),
        defineField({
            name: 'lines',
            title: 'Items',
            type: 'array',
            of: [{ type: 'orderLine' }],
            validation: (Rule) => Rule.min(1),
        }),
        defineField({ name: 'subtotal', title: 'Subtotal', type: 'number' }),
        defineField({ name: 'shippingCost', title: 'Shipping', type: 'number', initialValue: 0 }),
        defineField({ name: 'discount', title: 'Discount', type: 'number', initialValue: 0 }),
        defineField({ name: 'promoCode', title: 'Promo code used', type: 'string' }),
        defineField({ name: 'total', title: 'Total', type: 'number' }),
        defineField({
            name: 'paymentMethod',
            title: 'Payment method',
            type: 'string',
            options: {
                list: [
                    { title: 'Cash on delivery', value: 'cod' },
                    { title: 'Bank transfer', value: 'bank' },
                    { title: 'Card', value: 'card' },
                ],
            },
            initialValue: 'cod',
        }),
        defineField({
            name: 'createdAt',
            title: 'Placed at',
            type: 'datetime',
            readOnly: true,
            initialValue: () => new Date().toISOString(),
        }),
    ],
    orderings: [
        { title: 'Newest first', name: 'createdAtDesc', by: [{ field: 'createdAt', direction: 'desc' }] },
    ],
    preview: {
        select: { title: 'orderNumber', customer: 'customerName', total: 'total', status: 'status' },
        prepare: ({ title, customer, total, status }) => ({
            title: `${title} - ${customer ?? 'Guest'}`,
            subtitle: `Rs ${total ?? 0} · ${status}`,
        }),
    },
})

export const orderObjects = [orderLine, shippingAddress]
