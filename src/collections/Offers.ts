import type { Access, CollectionConfig } from 'payload'

// Utility: build a company-based access filter for collections with a direct `company` field
const companyAccess = (action: 'read' | 'update' | 'delete'): Access => ({ req }) => {
  const user = req.user
  if (!user) return false
  if (user?.roles?.includes?.('superadmin')) return true
  const companyIDs = (user?.companies || []).map((c) => (typeof c === 'object' ? c.id : c))
  if (!companyIDs.length) return false
  // For read, return a filter; for update/delete, also return a filter
  return { company: { in: companyIDs } }
}

export const Offers: CollectionConfig = {
  slug: 'offers',
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'company', 'active', 'validFrom', 'validUntil', 'maxRedemptions'],
  },
  access: {
    read: companyAccess('read'),
    update: companyAccess('update'),
    delete: companyAccess('delete'),
    create: ({ req }) => {
      const user = req.user
      return Boolean(user && (user.roles?.includes?.('superadmin') || (user.companies && user.companies.length)))
    },
  },
  fields: [
    {
      name: 'code',
      label: 'Coupon Code',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Human-friendly code customers will enter to redeem.',
      },
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'validFrom',
      type: 'date',
      required: false,
    },
    {
      name: 'validUntil',
      type: 'date',
      required: false,
    },
    {
      name: 'maxRedemptions',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Total number of times this coupon can be redeemed across all users.',
      },
    },
  ],
}
