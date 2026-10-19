'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Copy, Trophy, Users, Vote } from 'lucide-react'
import { toast } from 'sonner'
import { Navbar } from '@/components/Navbar'
import { tally, type Poll } from '@/lib/polls'

const VOTER_KEY = 'wander_voter'

// One random id per browser, plus the name it last voted under.
function getVoter(): { id: string; name: string } {
  try {
    const saved = JSON.parse(localStorage.getItem(VOTER_KEY) ?? 'null') as { id: string; name: string } | null
    if (saved?.id) return saved
  } catch { /* ignore */ }
  const voter = { id: crypto.randomUUID(), name: '' }
  localStorage.setItem(VOTER_KEY, JSON.stringify(voter))
  return voter
}

export function VoteView({ id }: { id: string }) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [missing, setMissing] = useState(false)
  const [voterId, setVoterId] = useState('')
  const [name, setName] = useState('')
  const [choices, setChoices] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/polls/${encodeURIComponent(id)}`).catch(() => null)
    if (!res) return
    if (res.status === 404) { setMissing(true); return }
    if (res.ok) setPoll(await res.json() as Poll)
  }, [id])

  useEffect(() => {
    const v = getVoter()
    setVoterId(v.id)
    setName(v.name)
    load()
    // Keep counts fresh while friends vote.
    const t = setInterval(() => { if (document.visibilityState === 'visible') load() }, 8000)
    return () => clearInterval(t)
  }, [load])

  // Pre-fill this browser's earlier picks once the poll arrives.
  useEffect(() => {
    if (!poll || dirty || !name) return
    const mine = poll.votes.find(v => v.name === name)
    if (mine) setChoices(mine.choices)
  }, [poll, name, dirty])

  function toggle(city: string) {
    setDirty(true)
    setChoices(c => (c.includes(city) ? c.filter(x => x !== city) : [...c, city]))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    const res = await fetch(`/api/polls/${encodeURIComponent(id)}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterId, name: trimmed, choices }),
    }).catch(() => null)
    setSaving(false)
    if (!res?.ok) { toast.error("Couldn't save your vote. Please try again."); return }
    localStorage.setItem(VOTER_KEY, JSON.stringify({ id: voterId, name: trimmed }))
    setDirty(false)
    toast('Vote saved')
    load()
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => toast('Link copied'), () => toast.error("Couldn't copy"))
  }

  const border = '1px solid color-mix(in srgb, var(--color-text) 12%, transparent)'

  if (missing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <h1 className="text-3xl" style={{ fontFamily: 'var(--font-playfair)' }}>This vote doesn&apos;t exist</h1>
        <p className="text-sm opacity-80">Check the link with whoever sent it.</p>
        <Link href="/" className="inline-flex items-center justify-center min-h-11 px-6 rounded-full text-sm font-semibold" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}>Go to Wander</Link>
      </div>
    )
  }

  const results = poll ? tally(poll.options, poll.votes) : null
  const maxCount = Math.max(1, ...(results?.counts.map(c => c.count) ?? [1]))

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <Navbar />
      <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {!poll ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-1">
              <Vote size={20} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
              <h1 className="text-3xl" style={{ fontFamily: 'var(--font-playfair)' }}>{poll.title}</h1>
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--color-subtle)' }}>
              Tap every place you&apos;d be happy with, then save your vote.
            </p>

            <button onClick={copyLink} className="inline-flex items-center gap-2 min-h-10 px-4 mb-6 rounded-full text-sm" style={{ border }}>
              <Copy size={14} aria-hidden="true" /> Copy link to share
            </button>

            <form onSubmit={submit} className="flex flex-col gap-3">
              <ul className="flex flex-col gap-2">
                {poll.options.map((o, i) => {
                  const picked = choices.includes(o.city)
                  const count = results!.counts[i].count
                  const isLeader = results!.leader === o.city
                  return (
                    <li key={o.city}>
                      <button type="button" onClick={() => toggle(o.city)} aria-pressed={picked}
                        className="relative w-full text-left rounded-2xl px-4 py-3 overflow-hidden"
                        style={{
                          backgroundColor: 'var(--color-card-bg)',
                          border: picked ? '2px solid var(--color-accent)' : border,
                        }}>
                        {/* Vote share bar */}
                        <span aria-hidden="true" className="absolute inset-y-0 left-0 transition-all duration-500"
                          style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)' }} />
                        <span className="relative flex items-center gap-3">
                          <span className="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: picked ? 'var(--color-accent)' : 'color-mix(in srgb, var(--color-text) 8%, transparent)', color: 'var(--color-bg)' }}>
                            {picked && <Check size={14} aria-hidden="true" />}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="flex items-center gap-1.5 font-medium">
                              {o.flagEmoji} {o.city}
                              {isLeader && <Trophy size={14} style={{ color: 'var(--color-accent)' }} aria-label="In the lead" />}
                            </span>
                            <span className="block text-xs truncate" style={{ color: 'var(--color-subtle)' }}>{o.tagline || o.country}</span>
                          </span>
                          <span className="text-sm tabular-nums" style={{ color: 'var(--color-subtle)' }}>{count} {count === 1 ? 'vote' : 'votes'}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              <label htmlFor="voter-name" className="text-sm font-medium mt-3">Your name</label>
              <input id="voter-name" value={name} onChange={e => setName(e.target.value)} maxLength={40} required
                placeholder="So friends know who voted"
                className="min-h-12 px-4 rounded-2xl text-sm outline-none"
                style={{ backgroundColor: 'var(--color-card-bg)', color: 'var(--color-text)', border }} />
              <button type="submit" disabled={saving || !name.trim()}
                className="min-h-14 rounded-full text-base font-semibold disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}>
                {saving ? 'Saving…' : choices.length ? `Save my vote (${choices.length})` : 'Save my vote'}
              </button>
            </form>

            {poll.votes.length > 0 && (
              <section className="mt-8">
                <h2 className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Users size={14} aria-hidden="true" /> {poll.votes.length} {poll.votes.length === 1 ? 'person has' : 'people have'} voted
                </h2>
                <ul className="text-sm flex flex-col gap-1" style={{ color: 'var(--color-subtle)' }}>
                  {poll.votes.map(v => (
                    <li key={v.name}><span style={{ color: 'var(--color-text)' }}>{v.name}</span>: {v.choices.length ? v.choices.join(', ') : 'no picks yet'}</li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
