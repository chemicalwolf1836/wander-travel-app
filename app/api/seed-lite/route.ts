import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'

const anthropic = new Anthropic()

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization')
  const secret = process.env.SEED_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()

  // Ask Claude to generate rich seed data for 25 popular travel destinations
  const prompt = `Generate seed data for 25 diverse, popular travel destinations covering all major world regions.

Return ONLY a valid JSON array (no markdown, no extra text) where each element has this exact shape:

{
  "name": string,           // country name
  "code": string,           // ISO 3166-1 alpha-2 code (e.g. "JP")
  "region": string,         // e.g. "Asia", "Europe", "Africa", "Americas", "Oceania"
  "capital": string,        // capital city name
  "flag_emoji": string,     // flag emoji e.g. "🇯🇵"
  "currency": string,       // currency name e.g. "Japanese Yen"
  "population": number,     // approximate population
  "coordinates": { "lat": number, "lng": number },
  "cultural_summary": string, // one evocative sentence (max 20 words) about the travel experience
  "best_seasons": string[], // e.g. ["March", "April", "May"]
  "visa_info": string,      // brief visa info e.g. "Visa on arrival for most nationalities"
  "cities": [
    {
      "name": string,
      "latitude": number,
      "longitude": number,
      "description": string,   // 1-2 sentences
      "travel_types": string[], // e.g. ["culture", "food", "beaches"]
      "best_for": string[]      // e.g. ["families", "solo", "couples"]
    }
  ],
  "cuisine": {
    "summary": string,          // 1-2 sentences on the food
    "signature_dishes": string[], // 5-8 dish names
    "dietary_options": string[]   // e.g. ["vegetarian", "seafood"]
  }
}

Include countries from: Japan, Italy, Morocco, Thailand, Brazil, Australia, Mexico, India, Greece, Iceland, Peru, South Africa, Vietnam, Turkey, New Zealand, Egypt, Portugal, Kenya, Colombia, Norway, Indonesia, France, Argentina, Tanzania, Cambodia.

Ensure variety in regions, climates, budgets, and travel styles. Use accurate coordinates and real city names.`

  console.log('[seed-lite] Generating destination data via Claude...')

  let raw: string
  try {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    })
    raw = res.content[0]?.type === 'text' ? res.content[0].text : '[]'
  } catch (err) {
    console.error('[seed-lite] Claude error:', err)
    return NextResponse.json({ error: 'Claude unavailable' }, { status: 503 })
  }

  const text = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  let destinations: Array<{
    name: string; code: string; region: string; capital: string; flag_emoji: string;
    currency: string; population: number; coordinates: { lat: number; lng: number };
    cultural_summary: string; best_seasons: string[]; visa_info: string;
    cities: Array<{ name: string; latitude: number; longitude: number; description: string; travel_types: string[]; best_for: string[] }>;
    cuisine: { summary: string; signature_dishes: string[]; dietary_options: string[] };
  }>

  try {
    destinations = JSON.parse(text)
  } catch (err) {
    console.error('[seed-lite] Parse error:', err)
    console.error('[seed-lite] Raw response:', text.slice(0, 500))
    return NextResponse.json({ error: 'Failed to parse Claude response' }, { status: 500 })
  }

  const counts = { countries: 0, cities: 0, cuisines: 0 }

  for (const dest of destinations) {
    // Upsert country
    const { data: country, error: countryErr } = await supabase
      .from('countries')
      .upsert({
        name: dest.name,
        code: dest.code,
        region: dest.region,
        capital: dest.capital,
        flag_emoji: dest.flag_emoji,
        currency: dest.currency,
        population: dest.population,
        coordinates: dest.coordinates,
        cultural_summary: dest.cultural_summary,
        best_seasons: dest.best_seasons,
        visa_info: dest.visa_info,
      }, { onConflict: 'code' })
      .select('id')
      .single()

    if (countryErr || !country) {
      console.error(`[seed-lite] Country error for ${dest.name}:`, countryErr?.message)
      continue
    }
    counts.countries++

    // Upsert cities
    for (const city of dest.cities ?? []) {
      const { error: cityErr } = await supabase
        .from('cities')
        .upsert({
          name: city.name,
          country_id: country.id,
          country_code: dest.code,
          latitude: city.latitude,
          longitude: city.longitude,
          description: city.description,
          travel_types: city.travel_types,
          best_for: city.best_for,
        }, { onConflict: 'name,country_code', ignoreDuplicates: true })

      if (cityErr) console.error(`[seed-lite] City error for ${city.name}:`, cityErr.message)
      else counts.cities++
    }

    // Upsert cuisine
    if (dest.cuisine) {
      const { error: cuisineErr } = await supabase
        .from('cuisines')
        .upsert({
          country_id: country.id,
          country_code: dest.code,
          summary: dest.cuisine.summary,
          signature_dishes: dest.cuisine.signature_dishes,
          dietary_options: dest.cuisine.dietary_options,
        }, { onConflict: 'country_code', ignoreDuplicates: true })

      if (cuisineErr) console.error(`[seed-lite] Cuisine error for ${dest.name}:`, cuisineErr.message)
      else counts.cuisines++
    }
  }

  console.log('[seed-lite] Done:', counts)
  return NextResponse.json({ success: true, counts })
}
