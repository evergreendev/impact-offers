import type { Access, CollectionConfig, Where } from 'payload'

// Access control based on the related offer's company
const redemptionAccess = (action: 'read' | 'update' | 'delete'): Access => async ({ req }) => {
  const user = req.user
  if (!user) return false
  if (user?.roles?.includes?.('superadmin')) return true
  const companyIDs = (user?.companies || []).map((c) => (typeof c === 'object' ? c.id : c))
  if (!companyIDs.length) return false
  // Filter by offers whose company is in user's companies
  const query: Where = {
      company: { in: companyIDs },
  }

  return query;
}

export const Redemptions: CollectionConfig = {
  slug: 'redemptions',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'offer', 'createdAt'],
  },
  access: {
    read: redemptionAccess('read'),
    update: redemptionAccess('update'),
    delete: redemptionAccess('delete'),
    // Creation is normally via custom endpoint; allow superadmin only here
    create: ({ req }) => Boolean((req.user)?.roles?.includes?.('superadmin')),
  },
  fields: [
    {
      name: 'offer',
      type: 'relationship',
      relationTo: 'offers',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
  ],
  timestamps: true,
}
