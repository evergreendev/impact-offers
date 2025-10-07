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
  hooks: {
    beforeValidate: [({ data }) => {
      if (!data) return
      const base = data.code ?? data.slug
      if (!base) return

      data.slug = String(base)
        .trim()
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }],
  },
  endpoints: [
    {
      path: '/:slug/redeem',
      method: 'post',
      handler: async (req) => {
        try {
          const data = await req.json?.();
          const { slug, email } = data || {}
          if (!slug || !email) {
            return Response.json({ error: 'slug and email are required' }, { status: 400 })
          }
          const normalizedEmail = String(email).trim().toLowerCase()

          // Find offer by slug (override access so public can redeem)
          const offersResult = await req.payload.find({
            collection: 'offers',
            where: { slug: { equals: String(slug).trim() } },
            limit: 1,
            overrideAccess: true,
          })
          const offer = offersResult?.docs?.[0]
          if (!offer) return Response.json({ error: 'Offer not found' }, { status: 404 })
          if (!offer.active) return Response.json({ error: 'Offer is not active' }, { status: 400 })

          const now = new Date()
          if (offer.validFrom && new Date(offer.validFrom) > now) {
            return Response.json({ error: 'Offer is not yet valid' }, { status: 400 })
          }
          if (offer.validUntil && new Date(offer.validUntil) < now) {
            return Response.json({ error: 'Offer has expired' }, { status: 400 })
          }

          // Enforce max redemptions
          const totalForOffer = await req.payload.count({
            collection: 'redemptions',
            where: { offer: { equals: offer.id } },
            overrideAccess: true,
          })
          if (typeof offer.maxRedemptions === 'number' && totalForOffer.totalDocs >= offer.maxRedemptions) {
            return Response.json({ error: 'Offer redemption limit reached'}, { status: 400 })
          }

          // Record redemption
          const redemption = await req.payload.create({
            collection: 'redemptions',
            data: {
              offer: offer.id,
              email: normalizedEmail,
            },
            req,
            overrideAccess: true,
          })

          const totalForEmailAndOffer = await req.payload.count({
            collection: 'redemptions',
            where: {
              and: [
                { offer: { equals: offer.id } },
                { email: { equals: normalizedEmail } },
              ],
            },
            overrideAccess: true,
          })
          return Response.json(({
            success: true,
            redemptionId: redemption.id,
            offer: {
              id: offer.id,
              slug: offer.slug,
              company: offer.company,
              validFrom: offer.validFrom,
              validUntil: offer.validUntil,
              maxRedemptions: offer.maxRedemptions,
            },
            counts: {
              totalForOffer: totalForOffer.totalDocs + 1,
              totalForEmailAndOffer: totalForEmailAndOffer.totalDocs,
            },
          }), { status: 200 })
        } catch (e) {
          req.payload.logger.error(e)
          return Response.json({ error: 'Offer has expired' }, { status: 500 })
        }
      },
    },
  ],
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
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
        description: 'Auto-generated from code and used in URLs.',
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
