import type { Access, CollectionConfig } from 'payload'

// Access control based on the related offer's company
const emailAccess = (action: 'read' | 'update' | 'delete'): Access => async ({ req }) => {
  const user = req.user
  if (!user) return false
  if (user?.roles?.includes?.('superadmin')) return true
  return false
}

export const emails: CollectionConfig = {
  slug: 'emails',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'verified', 'createdAt'],
  },
  access: {
    read: emailAccess('read'),
    update: emailAccess('update'),
    delete: emailAccess('delete'),
    // Creation is normally via custom endpoint; allow superadmin only here
    create: ({ req }) => Boolean((req.user)?.roles?.includes?.('superadmin')),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'verificationToken',
      type: 'text',
      required: false,
      admin: { position: 'sidebar', description: 'Auto-generated verification token' },
    },
    {
      name: 'verificationSentAt',
      type: 'date',
      required: false,
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}
