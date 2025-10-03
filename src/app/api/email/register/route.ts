import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const runtime = 'nodejs'

export const POST = async (req: Request) => {
  try {
    const { email } = await req.json?.() || {}
    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'email is required' }, { status: 400 })
    }
    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return Response.json({ error: 'invalid email' }, { status: 400 })
    }

    const payload = await getPayload({ config: await config })

    // Upsert email record (unverified by default)
    const existing = await payload.find({
      collection: 'emails',
      where: { email: { equals: normalizedEmail } },
      limit: 1,
      overrideAccess: true,
    })

    const now = new Date()
    let emailDoc = existing.docs[0]
    if (!emailDoc) {
      emailDoc = await payload.create({
        collection: 'emails',
        data: { email: normalizedEmail, verified: false },
        overrideAccess: true,
      })
    }

    // Always set/refresh cookie for future requests (180 days)
    const cookieStore = await cookies()
    const maxAge = 60 * 60 * 24 * 180
    cookieStore.set('impact_email', normalizedEmail, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge,
      path: '/',
    })

    // If not verified, generate a verification token and send email
    if (!emailDoc.verified) {
      const token = crypto.randomUUID()
      await payload.update({
        collection: 'emails',
        id: emailDoc.id,
        data: { verificationToken: token, verificationSentAt: now },
        overrideAccess: true,
      })

      const { origin } = new URL(req.url)
      const verifyURL = `${origin}/api/email/verify?token=${encodeURIComponent(token)}`

      // In a real app, integrate an email provider here.
      console.log(`[Email] Sending verification to ${normalizedEmail}: ${verifyURL}`)
    }

    return Response.json({ success: true })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
