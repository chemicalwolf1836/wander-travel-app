import { ImageResponse } from 'next/og'

export const alt = 'Wander destination'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Per-destination share image. params is a Promise in Next 16.
export default async function Image({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params
  const name = decodeURIComponent(city)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%)',
          color: '#f8fafc',
          fontFamily: 'serif',
        }}
      >
        <div style={{ fontSize: 36, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#94a3b8' }}>
          Discovered on Wander
        </div>
        <div style={{ fontSize: 140, fontWeight: 700, letterSpacing: '-0.03em', marginTop: 16 }}>{name}</div>
      </div>
    ),
    { ...size },
  )
}
