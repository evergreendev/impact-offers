'use client'
import { useState } from 'react'

export default function ResendVerificationButton({ email }: { email: string }) {
  const [status, setStatus] = useState<'idle'|'loading'|'sent'|'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    try {
      setStatus('loading')
      setError(null)
      const res = await fetch('/api/email/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'Failed to send email')
      }
      setStatus('sent')
    } catch (e) {
      setError((e as {message: string})?.message || 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <div className="email-verify">
      <p>We found your email {email}. It is not verified yet.</p>
      <button className="cursor-pointer rounded-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 mt-2" onClick={send} disabled={status==='loading'}>
        {status==='loading' ? 'Sending…' : (status==='sent' ? 'Verification sent' : 'Send verification email')}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
}
