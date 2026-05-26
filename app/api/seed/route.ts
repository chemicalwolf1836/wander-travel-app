import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'

const anthropic = new Anthropic()

// --- Type definitions for external APIs ---

interface RestCountry {
  name: { common: string; official: string }
  cca2: string
  region: string
  capital?: string[]
  flag: string
  languages?: Record<string, string>
  currencies?: Record<string, { name: string; symbol: string }>
  population: number
  latlng: number[]
}

interface GeoDBCity {
  city: string
  countryCode: string
  latitude: number
  longitude: number
  population: number
}

interface GeoDBResponse {
  data: GeoDBCity[]
}

interface MealDBMeal {
  strMeal: string
}

interface MealDBResponse {
  meals: MealDBMeal[] | null
}

interface OpenTripMapPlace {
  name: string
  kinds: string
  rate: number
  lat: number
  lon: number
}

// --- Seed handler ---

export async function GET(request: Request) {
  // Auth check
  const authHeader = request.headers.get('Authorization')
  const secret = process.env.SEED_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const counts = { countries: 0, cities: 0, cuisines: 0, attractions: 0 }

  // Step 1: Seed countries from REST Countries API
  console.log('[seed] Fetching countries...')
  const countriesRes = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,region,capital,flag,languages,currencies,population,latlng')
  const rawCountries: RestCountry[] = await countriesRes.json()

  const countryRows = rawCountries.map((c) => ({
    name: c.name.common,
    code: c.cca2,
    region: c.region ?? null,
    capital: c.capital?.[0] ?? null,
    flag_emoji: c.flag,
    languages: c.languages ?? null,
    currency: c.currencies ? Object.values(c.currencies)[0]?.name ?? null : null,
    population: c.population,
    coordinates: c.latlng?.length === 2 ? { lat: c.latlng[0], lng: c.latlng[1] } : null,
  }))

  const { error: countriesError } = await supabase
    .from('countries')
    .upsert(countryRows, { onConflict: 'code', ignoreDuplicates: false })

  if (countriesError) console.error('[seed] Countries error:', countriesError.message)
  else counts.countries = countryRows.length
  console.log(`[seed] Countries done: ${counts.countries}`)

  // Step 2: Seed cities from GeoDB - paginate to get up to 100 cities (10 per request, free tier)
  const geoKey = process.env.GEODB_API_KEY
  if (geoKey) {
    console.log('[seed] Fetching cities from GeoDB (paginated)...')

    const { data: dbCountries } = await supabase.from('countries').select('id, code')
    const codeToId: Record<string, string> = {}
    for (const c of dbCountries ?? []) codeToId[c.code] = c.id

    const allCities: GeoDBCity[] = []
    const pages = 10 // 10 pages x 10 results = 100 cities

    for (let page = 0; page < pages; page++) {
      const offset = page * 10
      const geoRes = await fetch(
        `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=10&offset=${offset}&minPopulation=500000&sort=-population&types=CITY`,
        { headers: { 'X-RapidAPI-Key': geoKey, 'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com' } }
      )
      const geoData: GeoDBResponse = await geoRes.json()
      if (!geoData.data?.length) break
      allCities.push(...geoData.data)
      console.log(`[seed] GeoDB page ${page + 1}: ${allCities.length} cities so far`)
      // Respect free tier rate limit - 1 request per second
      await new Promise((r) => setTimeout(r, 1100))
    }

    const cityRows = allCities
      .filter((c) => codeToId[c.countryCode])
      .map((c) => ({
        name: c.city,
        country_id: codeToId[c.countryCode],
        country_code: c.countryCode,
        latitude: c.latitude,
        longitude: c.longitude,
        population: c.population,
      }))

    const { error: citiesError } = await supabase
      .from('cities')
      .upsert(cityRows, { onConflict: 'name,country_code', ignoreDuplicates: true })

    if (citiesError) console.error('[seed] Cities error:', citiesError.message)
    else counts.cities = cityRows.length
    console.log(`[seed] Cities done: ${counts.cities}`)
  } else {
    console.log('[seed] Skipping GeoDB (no API key)')
  }

  // Step 3: Seed cuisines from TheMealDB (no key needed)
  console.log('[seed] Fetching cuisines from TheMealDB...')
  const { data: dbCountries } = await supabase.from('countries').select('id, code, name')
  const mealAreas = [
    'American', 'British', 'Canadian', 'Chinese', 'Croatian', 'Dutch',
    'Egyptian', 'Filipino', 'French', 'Greek', 'Indian', 'Irish', 'Italian',
    'Jamaican', 'Japanese', 'Kenyan', 'Malaysian', 'Mexican', 'Moroccan',
    'Polish', 'Portuguese', 'Russian', 'Spanish', 'Thai', 'Tunisian',
    'Turkish', 'Ukrainian', 'Vietnamese',
  ]

  const areaToCode: Record<string, string> = {
    American: 'US', British: 'GB', Canadian: 'CA', Chinese: 'CN', Croatian: 'HR',
    Dutch: 'NL', Egyptian: 'EG', Filipino: 'PH', French: 'FR', Greek: 'GR',
    Indian: 'IN', Irish: 'IE', Italian: 'IT', Jamaican: 'JM', Japanese: 'JP',
    Kenyan: 'KE', Malaysian: 'MY', Mexican: 'MX', Moroccan: 'MA', Polish: 'PL',
    Portuguese: 'PT', Russian: 'RU', Spanish: 'ES', Thai: 'TH', Tunisian: 'TN',
    Turkish: 'TR', Ukrainian: 'UA', Vietnamese: 'VN',
  }

  const codeToId: Record<string, string> = {}
  for (const c of dbCountries ?? []) codeToId[c.code] = c.id

  for (const area of mealAreas) {
    const code = areaToCode[area]
    if (!code || !codeToId[code]) continue

    const mealRes = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`)
    const mealData: MealDBResponse = await mealRes.json()
    const dishes = (mealData.meals ?? []).slice(0, 8).map((m) => m.strMeal)

    await supabase.from('cuisines').upsert(
      {
        country_id: codeToId[code],
        country_code: code,
        signature_dishes: dishes,
        summary: `Traditional ${area} cuisine featuring ${dishes.slice(0, 3).join(', ')} and more.`,
      },
      { onConflict: 'country_code', ignoreDuplicates: true }
    )
    counts.cuisines++
  }
  console.log(`[seed] Cuisines done: ${counts.cuisines}`)

  // Step 4: Seed attractions from OpenTripMap
  const tripKey = process.env.OPENTRIPMAP_API_KEY
  if (tripKey) {
    console.log('[seed] Fetching attractions from OpenTripMap...')
    const { data: cities } = await supabase
      .from('cities')
      .select('id, name, latitude, longitude')
      .limit(50)

    for (const city of cities ?? []) {
      const placesRes = await fetch(
        `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${city.longitude}&lat=${city.latitude}&kinds=interesting_places&rate=3&format=json&limit=5&apikey=${tripKey}`
      )
      const places: OpenTripMapPlace[] = await placesRes.json()

      const attractionRows = places
        .filter((p) => p.name)
        .map((p) => ({
          city_id: city.id,
          name: p.name,
          type: p.kinds?.split(',')[0] ?? 'attraction',
          latitude: p.lat,
          longitude: p.lon,
          popularity_score: p.rate,
        }))

      if (attractionRows.length) {
        await supabase.from('attractions').upsert(attractionRows, { ignoreDuplicates: true })
        counts.attractions += attractionRows.length
      }
    }
    console.log(`[seed] Attractions done: ${counts.attractions}`)
  } else {
    console.log('[seed] Skipping OpenTripMap (no API key)')
  }

  // Step 5: Generate cultural summaries for countries missing them (batches of 10)
  console.log('[seed] Generating cultural summaries...')
  const { data: needsSummary } = await supabase
    .from('countries')
    .select('id, name, region')
    .is('cultural_summary', null)
    .limit(30)

  if (needsSummary?.length) {
    for (let i = 0; i < needsSummary.length; i += 10) {
      const batch = needsSummary.slice(i, i + 10)
      const prompt = `For each country below, write a single evocative sentence (max 25 words) describing the travel experience. Respond with a JSON object mapping country name to summary. Countries: ${batch.map((c) => c.name).join(', ')}`

      const res = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      })

      const raw = res.content[0].type === 'text' ? res.content[0].text : '{}'
      const text = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      const summaries: Record<string, string> = JSON.parse(text)

      for (const country of batch) {
        if (summaries[country.name]) {
          await supabase
            .from('countries')
            .update({ cultural_summary: summaries[country.name] })
            .eq('id', country.id)
        }
      }
    }
  }

  console.log('[seed] All done!')
  return NextResponse.json({ success: true, counts })
}
