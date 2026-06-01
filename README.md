# Wander

An AI-powered travel discovery app that helps you find your perfect destination through natural conversation or guided prompts.

**Live:** https://wander-travel-app-jade.vercel.app

---

## Screenshots

> Add screenshots here

---

## Features

### Discovery
- **Free-text chat** — describe your dream trip in your own words; the AI asks one follow-up question and then searches
- **Guided mode** — tap through preset choice chips (climate, budget, travel style, etc.) for a structured flow
- **Surprise Me** — one-tap random destination discovery from the home page
- **Clickable floating city names** on the home page trigger a Surprise Me search inspired by that city

### Results
- **Interactive world map** with animated destination pins; accent colour shifts to match each destination's cultural theme
- **3D card tilt + image parallax** — hovering a card tilts it in perspective; the background photo shifts in the opposite direction for a depth effect
- **Cinematic card reveal** — cards materialise from a blur/scale animation with a stagger on first load
- **Detail view** — hero image, tagline, description, See / Eat / Best For chips, best seasons, practical info (currency, language, visa)
- **Item modals** — tap any attraction or dish chip for a Wikipedia-sourced image and description
- **Show more** — load 3 additional destinations without leaving the page
- **Comparison mode** — tap the compare icon on any two cards to view them side by side

### Planning tools (from the detail view)
- **Packing list** — AI-generated list organised by category; choose your trip length (3–14 days)
- **Itinerary builder** — day-by-day plan with morning / afternoon / evening breakdowns and insider tips; choose 3–10 days
- **Similar destinations** — AI suggests 3 more places with a matching vibe

### Saved
- **Heart any destination** to save it; saved list persists across sessions
- **Undo remove** — a 3.5-second grace window with an Undo toast
- **Trip notes** — jot personal notes (dates, budget, ideas) on each saved destination; saves automatically
- **Explore from saved** — generate new suggestions inspired by any saved city

### Share
- **Share card** — a styled travel-poster modal with Copy text and native Share options; screenshot to save

### Personalise panel
- Dark / light mode toggle
- 5 colour theme presets (Midnight, Dawn, Forest, Ocean, Desert)
- 7 accent colour quick-picks + custom colour picker
- Font size toggle (Normal / Large)
- Map style (Default / Satellite / Minimal)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| AI | Anthropic Claude (Sonnet 4.6 / Haiku 4.5) |
| Database | Supabase (PostgreSQL) |
| Map | Mapbox GL + react-simple-maps |
| Weather | OpenWeatherMap API |
| Images | Wikipedia REST API + Wikimedia Commons |
| Deployment | Vercel |

---

## AI Integration

Three Claude-powered API routes:

- **`/api/suggest`** — takes user preferences and returns 3 structured destination objects including coordinates, cultural theme colours, attractions, food, and practical info. Results are cached in Supabase for 24 hours.
- **`/api/packing`** — generates a categorised packing list (Claude Haiku) based on destination, climate, and trip length.
- **`/api/itinerary`** — generates a day-by-day itinerary (Claude Haiku) with morning / afternoon / evening slots and a local tip per day.
- **`/api/chat`** — powers the free-text discovery chat; returns structured JSON signalling when the AI has enough information to search.
- **`/api/item-info`** — enriches attraction and dish chips with Wikipedia summaries and Wikimedia Commons images; Claude fills in where Wikipedia isn't relevant.

---

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in your API keys
npm run dev
```

Required environment variables:

```
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_MAPBOX_TOKEN
OPENWEATHER_API_KEY
```

---

## Author

Batmagnai Ganbaatar
