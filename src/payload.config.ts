// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Companies } from './collections/Companies'
import { Offers } from './collections/Offers'
import { Redemptions } from './collections/Redemptions'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  endpoints: [
    {
      path: '/offers/redeem',
      method: 'post',
      handler: async (req) => {
        try {
          const data = await req.json?.();
          const { code, email } = data || {}
          if (!code || !email) {
            return Response.json({ error: 'code and email are required' }, { status: 400 })
          }
          const normalizedEmail = String(email).trim().toLowerCase()

          // Find offer by code (override access so public can redeem)
          const offersResult = await req.payload.find({
            collection: 'offers',
            where: { code: { equals: String(code).trim() } },
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
              code: offer.code,
              company: offer.company,
              validFrom: offer.validFrom,
              validUntil: offer.validUntil,
              maxRedemptions: offer.maxRedemptions,
            },
            counts: {
              totalForOffer: totalForOffer.totalDocs + 1,
              totalForEmailAndOffer,
            },
          }), { status: 200 })
        } catch (e) {
          req.payload.logger.error(e)
          return Response.json({ error: 'Offer has expired' }, { status: 500 })
        }
      },
    },
  ],
  collections: [Users, Media, Companies, Offers, Redemptions],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
  ],
})
