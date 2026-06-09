import { ImageResponse } from 'next/og'

// Social share image: emitted as og:image automatically by the file convention.
export const alt = 'Wander — AI Travel Concierge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
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
        <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: '-0.03em' }}>Wander</div>
        <div
          style={{
            marginTop: 24,
            fontSize: 40,
            color: '#cbd5e1',
            maxWidth: 800,
            textAlign: 'center',
          }}
        >
          Tell us what you are dreaming of. We will find your perfect destination.
        </div>
      </div>
    ),
    { ...size },
  )
}
