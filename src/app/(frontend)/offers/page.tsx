import Link from 'next/link'
import { getPayload } from 'payload'
import { cookies } from 'next/headers'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

export default async function OffersPage() {
  const payload = await getPayload({ config: await config })

  // Optional: ensure the user is verified by cookie; requirement already redirects from home.
  const cookieStore = await cookies()
  const email = cookieStore.get('impact_email')?.value?.toLowerCase()

  // Fetch active offers (public read via overrideAccess)
  const offers = await payload.find({
    collection: 'offers',
    where: { active: { equals: true } },
    limit: 100,
    overrideAccess: true,
  })

  return (
    <div className="offers-page">
      <div className="content">
        <h1>All Offers</h1>
        {!offers.docs?.length && <p>No offers available right now. Please check back later.</p>}
        <div className="offers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {offers.docs?.map((offer) => (
            <Link key={offer.id} href={`/offers/${offer.slug}`} className="offer-card" style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: 8, textDecoration: 'none', color: 'inherit' }}>
              <h3 style={{ margin: '0 0 .5rem' }}>{offer.code}</h3>
              {offer.description && <p style={{ margin: 0 }}>{offer.description}</p>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
