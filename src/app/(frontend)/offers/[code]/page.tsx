import Link from 'next/link'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import RedeemButton from '@/app/(frontend)/offers/RedeemButton'
import ResendVerificationButton from '@/app/EmailForm/ResendVerificationButton'

type Params = Promise<{ code: string }>

export const dynamic = 'force-dynamic'

export default async function OfferDetailPage({ params }: { params: Params }) {
  const { code } = await params
  const payload = await getPayload({ config: await config })

  // Load offer by slug (public)
  const res = await payload.find({
    collection: 'offers',
    where: { slug: { equals: String(code) } },
    limit: 1,
    overrideAccess: true,
  })
  const offer = res.docs?.[0]

  if (!offer) {
    return (
      <div className="offer-detail">
        <div className="content">
          <h1>Offer not found</h1>
          <p><Link href="/offers">Back to offers</Link></p>
        </div>
      </div>
    )
  }

  // Determine email + verified state
  const cookieStore = await cookies()
  const email = cookieStore.get('impact_email')?.value?.toLowerCase() || ''
  let isVerified = false
  if (email) {
    try {
      const result = await payload.find({
        collection: 'emails',
        where: { and: [ { email: { equals: email } }, { verified: { equals: true } } ] },
        limit: 1,
        overrideAccess: true,
      })
      isVerified = (result.docs?.length || 0) > 0
    } catch {}
  }

  return (
    <div className="offer-detail">
      <div className="content">
        <h1>{offer.code}</h1>
        {offer.description && <p style={{ maxWidth: 720 }}>{offer.description}</p>}

        <div>
          <p>
            Show this screen to the person behind the counter. They should click the button below to redeem the offer. Clicking the button will immediately redeem this offer.
          </p>
        </div>

        {!email && (
          <p>
            No email found. Please <Link href="/">go back</Link> and enter your email first.
          </p>
        )}

        {email && !isVerified && (
          <div>
            <p>
              Your email ({email}) is not verified yet. Please verify your email before redeeming.
            </p>
            <ResendVerificationButton email={email} />
          </div>
        )}

        {email && isVerified && (
          <RedeemButton slug={offer.slug} email={email} />
        )}

        <p style={{ marginTop: '1.5rem' }}>
          <Link href="/offers">Back to all offers</Link>
        </p>
      </div>
    </div>
  )
}
