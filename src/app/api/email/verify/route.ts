import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const runtime = 'nodejs'

export const GET = async (req: Request) => {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    if (!token) {
      return new Response('Missing token', { status: 400 })
    }

    const payload = await getPayload({ config: await config })

    const result = await payload.find({
      collection: 'emails',
      where: { verificationToken: { equals: token } },
      limit: 1,
      overrideAccess: true,
    })

    const doc = result.docs[0]
    if (!doc) {
      return new Response('Invalid or expired token', { status: 400 })
    }

    await payload.update({
      collection: 'emails',
      id: doc.id,
      data: { verified: true, verificationToken: null },
      overrideAccess: true,
    })

    const cookieStore = await cookies()
    // Refresh cookie for 180 days
    const maxAge = 60 * 60 * 24 * 180
    cookieStore.set('impact_email', String(doc.email).toLowerCase(), {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge,
      path: '/',
    })

    // Redirect to home after verification
    const home = `${url.origin}/`
    return Response.redirect(home, 302)
  } catch (e) {
    console.error(e)
    return new Response('Internal Server Error', { status: 500 })
  }
}
