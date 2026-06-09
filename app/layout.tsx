import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter, Manrope } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from 'sonner'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

// Validate required env vars on startup so errors are obvious immediately
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

export const metadata: Metadata = {
  metadataBase: new URL('https://wander-travel-app-jade.vercel.app'),
  title: 'Wander — AI Travel Concierge',
  description: 'Tell us what you are dreaming of. We will find your perfect destination.',
  openGraph: {
    title: 'Wander — AI Travel Concierge',
    description: 'Tell us what you are dreaming of. We will find your perfect destination.',
    url: '/',
    siteName: 'Wander',
    type: 'website',
    locale: 'en_GB',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
