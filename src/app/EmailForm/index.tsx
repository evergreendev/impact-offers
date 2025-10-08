'use client'
import { FormEvent, useState } from 'react'

const EmailForm = () => {

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch('/api/email/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'Failed to save email')
      }
      setStatus('success')
      // Refresh to re-evaluate cookie / verified state
      window.location.reload()
    } catch (e) {
      setError((e as {message: string})?.message || 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <form onSubmit={onSubmit} className="email-form">
      <label>
        Enter your email to continue:
        <input
          type="email"
          className="border border-gray-300 rounded-md px-3 py-2 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </label>
      <button className="rounded-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 mt-2" type="submit" disabled={status==='loading'}>
        {status==='loading' ? 'Saving…' : 'Submit'}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  )
}


export default EmailForm;
