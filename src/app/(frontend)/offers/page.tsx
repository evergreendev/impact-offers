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
  const redemptions = await payload.find({
    collection: 'redemptions',
    where: { email: { equals: email } },
    limit: 0,
    overrideAccess: true,
  })

  const offersWithRedemptions = offers.docs?.map((offer) => {
    const redemption = redemptions.docs?.filter((r) =>
      typeof r.offer === 'number' ? r.offer : r.offer.id === offer.id,
    )
    return {
      ...offer,
      redemptionCount: redemption?.length || 0,
    }
  })

  return (
    <div className="offers-page">
      <div className="content">
        <h1 className="text-center">Your Available Impact Offers</h1>
        {!offers.docs?.length && <p>No offers available right now. Please check back later.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2  lg:grid-cols-3 gap-4">
          {offersWithRedemptions.map((offer) => {
            const isDisabled: boolean = !!(
              offer.maxRedemptions <= offer.redemptionCount ||
              (offer.validUntil && new Date(offer.validUntil) < new Date()) ||
              (offer.validFrom && new Date(offer.validFrom) > new Date())
            )

            return (
              <Link
                key={offer.id}
                aria-disabled={isDisabled}
                href={`/offers/${offer.slug}`}
                className={`py-2 text-sm font-medium flex flex-col
           bg-red-200 text-white shadow-sm transition
           hover:bg-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
           aria-disabled:bg-gray-200 aria-disabled:text-gray-700 aria-disabled:border aria-disabled:border-gray-300
           aria-disabled:shadow-none aria-disabled:cursor-not-allowed offer-card border aria-disabled:pointer-events-none border-red-500 rounded-sm`}
              >
                <h3
                  className={`text-3xl  font-bold text-center ${isDisabled ? 'bg-gray-100' : 'text-white bg-[#d80707]'}`}
                >
                  {typeof offer.company !== 'number' ? <span className="text-lg font-normal block">{offer.company.name}</span> : ''}
                  {offer.code}
                </h3>
                {offer.description && <p className="text-center p-2">{offer.description}</p>}
                <div className="text-center p-2 text-slate-800">
                  {offer.validFrom && (
                    <div>
                      Offer valid starting: {new Date(offer.validFrom).toLocaleDateString()}
                    </div>
                  )}
                  {offer.validUntil && (
                    <div>Valid until: {new Date(offer.validUntil).toLocaleDateString()}</div>
                  )}
                  {!offer.validFrom && !offer.validUntil && <div>No expiration date</div>}
                </div>
                {offer.maxRedemptions > offer.redemptionCount ? (
                  <div className="text-slate-800 bg-slate-50 font-bold text-center p-2 mt-auto">
                    You can use this offer ({offer.maxRedemptions - offer.redemptionCount}) more
                    time
                    {offer.redemptionCount === 1 ? '' : 's'}
                  </div>
                ) : (
                  <div className="text-slate-800 bg-slate-50 font-bold text-center p-2 mt-auto">
                    You&#39;ve reached the limit on this offer.
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
