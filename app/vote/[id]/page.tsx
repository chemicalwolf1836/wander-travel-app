import type { Metadata } from 'next'
import { VoteView } from './VoteView'

export const metadata: Metadata = {
  title: 'Vote on where to go · Wander',
  description: 'Help pick the destination: tap the places you would be happy with.',
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <VoteView id={id} />
}
