import { defineField, defineType } from 'sanity'

/**
 * Dashboard login account.
 *
 * ⚠ Lives in the PRIVATE `admin` dataset only. `passwordHash` must never be
 * readable without a token, which is why the catalogue and the auth store are
 * separate datasets.
 */
export const adminUser = defineType({
    name: 'adminUser',
    title: 'Admin user',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            validation: (Rule) => Rule.required().max(80),
        }),
        defineField({
            name: 'email',
            title: 'Email',
            type: 'string',
            description: 'Used to sign in. Stored lower-cased.',
            validation: (Rule) =>
                Rule.required()
                    .lowercase()
                    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { name: 'email' })
                    .error('Enter a valid email address'),
        }),
        defineField({
            name: 'passwordHash',
            title: 'Password hash',
            type: 'string',
            description: 'bcrypt hash — set by the dashboard, never edit by hand.',
            readOnly: true,
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'role',
            title: 'Role',
            type: 'string',
            options: {
                list: [
                    { title: 'Owner (full access)', value: 'owner' },
                    { title: 'Staff', value: 'staff' },
                ],
                layout: 'radio',
            },
            initialValue: 'staff',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'permissions',
            title: 'Permissions',
            type: 'array',
            of: [{ type: 'string' }],
            description: 'Ignored for owners, who always have full access.',
            options: {
                list: [
                    { title: 'Manage products', value: 'products' },
                    { title: 'Manage categories', value: 'categories' },
                    { title: 'Manage orders', value: 'orders' },
                    { title: 'Manage users', value: 'users' },
                    { title: 'Manage settings', value: 'settings' },
                ],
            },
        }),
        defineField({
            name: 'active',
            title: 'Active',
            type: 'boolean',
            description: 'Turn off to revoke access without deleting the account.',
            initialValue: true,
        }),
        defineField({
            name: 'sessionsValidFrom',
            title: 'Sessions valid from',
            type: 'datetime',
            readOnly: true,
            description:
                'Sign-ins issued before this are refused. Set automatically when the password changes or access is revoked.',
        }),
        defineField({
            name: 'failedLogins',
            title: 'Failed sign-ins',
            type: 'number',
            readOnly: true,
        }),
        defineField({
            name: 'lockedUntil',
            title: 'Locked until',
            type: 'datetime',
            readOnly: true,
            description: 'Set after repeated failed sign-ins; expires by itself.',
        }),
        defineField({
            name: 'createdAt',
            title: 'Created at',
            type: 'datetime',
            readOnly: true,
            initialValue: () => new Date().toISOString(),
        }),
    ],
    preview: {
        select: { title: 'name', subtitle: 'email', role: 'role' },
        prepare({ title, subtitle, role }) {
            return { title: `${title}${role === 'owner' ? ' (owner)' : ''}`, subtitle }
        },
    },
})

export const passwordResetToken = defineType({
    name: 'passwordResetToken',
    title: 'Password reset token',
    type: 'document',
    fields: [
        defineField({ name: 'user', title: 'User', type: 'reference', to: [{ type: 'adminUser' }] }),
        defineField({ name: 'tokenHash', title: 'Token hash', type: 'string', readOnly: true }),
        defineField({ name: 'expiresAt', title: 'Expires at', type: 'datetime', readOnly: true }),
    ],
    preview: {
        select: { title: 'user.email', subtitle: 'expiresAt' },
    },
})
