'use client'

import { createClient } from '@supabase/supabase-js'

// Browser client - uses the public anon key. Safe to use in client components.
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase public environment variables')
  }

  return createClient(url, key)
}
