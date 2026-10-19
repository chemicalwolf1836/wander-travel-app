'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getBrowserClient } from '@/lib/supabase/client'
import { readLocal, writeLocal, mergeSyncData, type SyncData } from '@/lib/sync'
import { DATA_CHANGED_EVENT, DATA_SYNCED_EVENT } from '@/lib/syncEvents'

type SyncStatus = 'signed-out' | 'syncing' | 'synced' | 'error'

interface SyncContextValue {
  user: User | null
  status: SyncStatus
  lastSyncedAt: string | null
  signIn: (email: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const SyncContext = createContext<SyncContextValue | null>(null)

// Which account this device last merged with, and when it last pushed.
const MERGED_USER_KEY = 'wander_sync_user'
const PUSHED_AT_KEY = 'wander_sync_at'

function announceReplaced(data: SyncData) {
  const favs = Array.isArray(data.wander_favourites) ? data.wander_favourites.length : 0
  window.dispatchEvent(new CustomEvent('wander-favourites-changed', { detail: { count: favs } }))
  window.dispatchEvent(new Event(DATA_SYNCED_EVENT))
}

/**
 * Keeps saved places, notes, dates, plans and settings in step with the
 * signed-in account. The first sign-in on a device merges both sides; after
 * that the account is the source of truth, and every local change is pushed.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<SyncStatus>('signed-out')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const applyingRemote = useRef(false)

  const push = useCallback(async (u: User) => {
    const supabase = getBrowserClient()
    const now = new Date().toISOString()
    setStatus('syncing')
    const { error } = await supabase
      .from('user_data')
      .upsert({ user_id: u.id, data: readLocal(), updated_at: now })
    if (error) { setStatus('error'); return }
    localStorage.setItem(PUSHED_AT_KEY, now)
    setLastSyncedAt(now)
    setStatus('synced')
  }, [])

  const pull = useCallback(async (u: User) => {
    const supabase = getBrowserClient()
    setStatus('syncing')
    const { data: row, error } = await supabase
      .from('user_data')
      .select('data, updated_at')
      .eq('user_id', u.id)
      .maybeSingle()
    if (error) { setStatus('error'); return }

    const remote = (row?.data ?? {}) as SyncData
    const local = readLocal()
    const mergedBefore = localStorage.getItem(MERGED_USER_KEY) === u.id
    const pushedAt = localStorage.getItem(PUSHED_AT_KEY) ?? ''

    if (!mergedBefore) {
      const merged = mergeSyncData(local, remote)
      applyingRemote.current = true
      writeLocal(merged)
      applyingRemote.current = false
      localStorage.setItem(MERGED_USER_KEY, u.id)
      announceReplaced(merged)
      await push(u)
    } else if (row && row.updated_at > pushedAt) {
      applyingRemote.current = true
      writeLocal(remote)
      applyingRemote.current = false
      localStorage.setItem(PUSHED_AT_KEY, row.updated_at)
      announceReplaced(remote)
      setLastSyncedAt(row.updated_at)
      setStatus('synced')
    } else {
      await push(u)
    }
  }, [push])

  // Track the session.
  useEffect(() => {
    let supabase
    try { supabase = getBrowserClient() } catch { return }
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Pull when a user appears, and again whenever the tab comes back into view.
  useEffect(() => {
    if (!user) { setStatus('signed-out'); return }
    pull(user)
    function onVisible() { if (document.visibilityState === 'visible' && user) pull(user) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [user, pull])

  // Push local changes, debounced.
  useEffect(() => {
    if (!user) return
    function onChanged() {
      if (applyingRemote.current || !user) return
      if (pushTimer.current) clearTimeout(pushTimer.current)
      pushTimer.current = setTimeout(() => push(user), 800)
    }
    window.addEventListener(DATA_CHANGED_EVENT, onChanged)
    return () => window.removeEventListener(DATA_CHANGED_EVENT, onChanged)
  }, [user, push])

  const signIn = useCallback(async (email: string) => {
    const { error } = await getBrowserClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/account` },
    })
    return error ? { error: error.message } : {}
  }, [])

  const signOut = useCallback(async () => {
    await getBrowserClient().auth.signOut()
    // Keep this device's data, but merge again if someone signs in later.
    localStorage.removeItem(MERGED_USER_KEY)
    localStorage.removeItem(PUSHED_AT_KEY)
    setUser(null)
  }, [])

  return (
    <SyncContext.Provider value={{ user, status, lastSyncedAt, signIn, signOut }}>
      {children}
    </SyncContext.Provider>
  )
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSync must be used inside <SyncProvider>')
  return ctx
}
