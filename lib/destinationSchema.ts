import { z } from 'zod'

// Validates destination objects the browser sends back to the server (shared
// links, polls). Loose on optional extras, strict on the fields pages need.
export const destinationSchema = z.object({
  city: z.string().min(1).max(80),
  country: z.string().min(1).max(80),
  countryCode: z.string().max(3),
  region: z.string().max(80),
  flagEmoji: z.string().max(16),
  tagline: z.string().max(300),
  description: z.string().max(3000),
  coordinates: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
  food: z.object({ summary: z.string().max(1000), dishes: z.array(z.string().max(80)).max(20) }),
  attractions: z.array(z.string().max(120)).max(20),
  bestFor: z.array(z.string().max(80)).max(20),
  bestSeasons: z.array(z.string().max(80)).max(12).optional(),
  emoji: z.string().max(16),
  culturalTheme: z.object({
    primary: z.string().max(32),
    accent: z.string().max(32),
    background: z.string().max(32),
    cardBg: z.string().max(32),
    text: z.string().max(32),
    mood: z.string().max(120),
  }),
  currency: z.string().max(80).optional(),
  language: z.string().max(120).optional(),
  visaInfo: z.string().max(400).optional(),
  monthFit: z.string().max(200).optional(),
})
