import { NextResponse } from 'next/server'
import { getSharedDestination } from '@/lib/sharedDestinationsServer'

export async function GET(_req: Request, { params }: { params: Promise<{ city: string }> }) {
  const { city } = await params
  const dest = await getSharedDestination(decodeURIComponent(city))
  if (!dest) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(dest, { headers: { 'Cache-Control': 'public, max-age=300' } })
}
