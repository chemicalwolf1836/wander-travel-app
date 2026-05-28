export interface Destination {
  city: string
  country: string
  countryCode: string
  region: string
  flagEmoji: string
  tagline: string
  description: string
  coordinates: { lat: number; lng: number }
  food: { summary: string; dishes: string[] }
  attractions: string[]
  bestFor: string[]
  bestSeasons?: string[]
  emoji: string
  culturalTheme: CulturalTheme
  weather?: WeatherData
  currency?: string
  language?: string
  visaInfo?: string
}

export interface CulturalTheme {
  primary: string
  accent: string
  background: string
  cardBg: string
  text: string
  mood: string
}

export interface WeatherData {
  condition: string
  temp: number
  feelsLike: number
  icon: string
  description: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface Preferences {
  summary: string
  climate: string
  budget: string
  travelStyle: string
  foodPreferences: string
  other: string
}

export interface ThemePreset {
  primary: string
  accent: string
  background: string
  cardBg: string
  text: string
  subtle: string
  fontMood: 'elegant' | 'bold' | 'minimal' | 'warm' | 'vibrant'
  bgStyle: 'gradient' | 'noise' | 'geometric' | 'clean'
}

export interface AppSettings {
  fontSize: 'default' | 'large'
  cardLayout: 'grid' | 'list'
  accentColor: string
  mapStyle: 'default' | 'satellite' | 'minimal'
}
