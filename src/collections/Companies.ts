import type { CollectionConfig } from 'payload'

export const Companies: CollectionConfig = {
  slug: 'companies',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'createdAt'],
  },
  access: {
    read: ({ req }) => {
      const user = req.user
      if (!user) return false
      if (user?.roles?.includes?.('superadmin')) return true;
      // Allow reading companies the user is assigned to
      if (Array.isArray(user?.companies) && user.companies.length > 0) {
        return {
          id: { in: user.companies.map((c) => (typeof c === 'object' ? c.id : c)) },
        }
      }
      // If user has no companies, deny
      return false
    },
    create: ({ req }) => {
      // Only allow users explicitly marked as superadmins to create companies
      const user = req.user
      return Boolean(user?.roles?.includes?.('superadmin'))
    },
    update: ({ req }) => {
      const user = req.user
      if (!user) return false
      if (user?.roles?.includes?.('superadmin')) return true
      return {
        id: { in: (user.companies || []).map((c) => (typeof c === 'object' ? c.id : c)) },
      }
    },
    delete: ({ req }) => {
      const user = req.user
      return Boolean(user?.roles?.includes?.('superadmin'))
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
  ],
}
