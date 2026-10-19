'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Browser client - uses the public anon key. Safe to use in client components.
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase public environment variables')
  }

  return createClient(url, key)
}

// One shared client per tab, so the signed-in session (kept in localStorage)
// is managed by a single auth instance.
let _client: SupabaseClient | null = null
export function getBrowserClient(): SupabaseClient {
  if (!_client) _client = createBrowserClient()
  return _client
}
