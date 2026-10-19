'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Cloud, CloudOff, LogOut, Mail, RefreshCw } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { useSync } from '@/components/SyncProvider'

export default function AccountPage() {
  const { user, status, lastSyncedAt, signIn, signOut } = useSync()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    const res = await signIn(email.trim())
    setSending(false)
    if (res.error) setError(res.error)
    else setSent(true)
  }

  const card = {
    backgroundColor: 'var(--color-card-bg)',
    border: '1px solid color-mix(in srgb, var(--color-text) 10%, transparent)',
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <Navbar />
      <main className="flex-1 w-full max-w-md mx-auto px-6 pt-28 pb-16">
        <h1 className="text-4xl mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>Your account</h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--color-subtle)' }}>
          Sign in to keep your saved places, notes, trip dates and plans on every device.
        </p>

        {user ? (
          <div className="rounded-3xl p-6 flex flex-col gap-5" style={card}>
            <div className="flex items-center gap-3">
              {status === 'error'
                ? <CloudOff size={20} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
                : <Cloud size={20} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs" role="status" style={{ color: 'var(--color-subtle)' }}>
                  {status === 'syncing' && 'Syncing…'}
                  {status === 'synced' && `Synced${lastSyncedAt ? ` at ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}`}
                  {status === 'error' && "Couldn't sync. Your data is safe on this device; we'll retry."}
                </p>
              </div>
            </div>
            <Link href="/saved" className="inline-flex items-center justify-center min-h-12 rounded-full text-sm font-semibold"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}>
              Go to saved places
            </Link>
            <button onClick={signOut} className="inline-flex items-center justify-center gap-2 min-h-12 rounded-full text-sm"
              style={{ border: '1px solid color-mix(in srgb, var(--color-text) 18%, transparent)' }}>
              <LogOut size={16} aria-hidden="true" /> Sign out
            </button>
            <p className="text-xs" style={{ color: 'var(--color-subtle)' }}>
              Signing out keeps everything on this device.
            </p>
          </div>
        ) : sent ? (
          <div className="rounded-3xl p-6 flex flex-col gap-3" style={card} role="status">
            <Mail size={22} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
            <p className="text-base font-medium">Check your inbox</p>
            <p className="text-sm" style={{ color: 'var(--color-subtle)' }}>
              We sent a sign-in link to {email}. Open it on this device to finish signing in.
            </p>
            <button onClick={() => setSent(false)} className="inline-flex items-center gap-2 text-sm self-start min-h-10"
              style={{ color: 'var(--color-accent)' }}>
              <RefreshCw size={14} aria-hidden="true" /> Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-3xl p-6 flex flex-col gap-4" style={card}>
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="min-h-12 px-4 rounded-2xl text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                border: '1px solid color-mix(in srgb, var(--color-text) 18%, transparent)',
              }}
            />
            {error && <p className="text-xs" role="alert" style={{ color: '#f87171' }}>{error}</p>}
            <button type="submit" disabled={sending || !email.trim()}
              className="inline-flex items-center justify-center gap-2 min-h-12 rounded-full text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}>
              <Mail size={16} aria-hidden="true" /> {sending ? 'Sending…' : 'Email me a sign-in link'}
            </button>
            <p className="text-xs" style={{ color: 'var(--color-subtle)' }}>
              No password needed. Anything already saved on this device is kept and added to your account.
            </p>
          </form>
        )}
      </main>
    </div>
  )
}
