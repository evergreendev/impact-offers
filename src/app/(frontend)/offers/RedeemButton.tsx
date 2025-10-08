'use client'
import { useState } from 'react'

export default function RedeemButton({ slug, email }: { slug: string, email: string }) {
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [message, setMessage] = useState<string>('')

  const redeem = async () => {
    try {
      setStatus('loading')
      setMessage('')
      const res = await fetch(`/api/offers/${slug}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug, email }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(j?.error || 'Failed to redeem')
      }
      setStatus('success')

      const totalForEmailAndOffer = j?.counts?.totalForEmailAndOffer
      setMessage(`Redeemed! Your email has used this offer ${totalForEmailAndOffer} time(s).`)
    } catch (e: unknown) {
      setStatus('error')
      setMessage((e as { message: string })?.message || 'Something went wrong')
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        className="mx-auto bg-red-600 cursor-pointer hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-md transition-colors duration-200"
        onClick={redeem}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Redeeming…' : 'Redeem now'}
      </button>
      {!!message && (
        <p role={status === 'error' ? 'alert' : undefined} style={{ marginTop: '.5rem' }}>
          {message}
        </p>
      )}
    </div>
  )
}
