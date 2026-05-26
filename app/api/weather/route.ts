import { NextResponse } from 'next/server'
import type { WeatherData } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')
  const country = searchParams.get('country')

  if (!city || !country) {
    return NextResponse.json({ error: 'Missing city or country param' }, { status: 400 })
  }

  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) {
    // Return null gracefully - weather is enhancement, not a blocker
    return NextResponse.json(null)
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},${country}&appid=${apiKey}&units=metric`
  const res = await fetch(url, { next: { revalidate: 1800 } }) // cache 30 min

  if (!res.ok) {
    return NextResponse.json(null)
  }

  const data: {
    weather: Array<{ main: string; description: string; icon: string }>
    main: { temp: number; feels_like: number }
  } = await res.json()

  const weather: WeatherData = {
    condition: data.weather[0].main,
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    icon: data.weather[0].icon,
    description: data.weather[0].description,
  }

  return NextResponse.json(weather)
}
