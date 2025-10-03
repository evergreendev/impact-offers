import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import './styles.css'
import EmailForm from '@/app/EmailForm'
import ResendVerificationButton from '@/app/EmailForm/ResendVerificationButton'

export default async function HomePage() {
  const cookieStore = await cookies()
  const email = cookieStore.get('impact_email')?.value?.toLowerCase()
  const payload = await getPayload({ config: await config })

  let isVerified = false
  if (email) {
    try {
      const result = await payload.find({
        collection: 'emails',
        where: {
          and: [
            { email: { equals: email } },
            { verified: { equals: true } },
          ],
        },
        limit: 1,
        overrideAccess: true,
      })
      isVerified = (result.docs?.length || 0) > 0
    } catch {}
  }

  return (
    <div className="home">
      <div className="content">
        <h1>Impact Offers</h1>
        {!email && !isVerified && <EmailForm />}
        {email && !isVerified && <ResendVerificationButton email={email} />}
        {isVerified && (
          <p>Welcome back{email ? `, ${email}` : ''}! Your email is verified.</p>
        )}
      </div>
    </div>
  )
}
