// Wikimedia's API etiquette requires every request to carry a descriptive
// User-Agent that identifies the app and a contact; requests without one are
// throttled or 403-blocked, which shows up as missing destination photos.
//
// Browsers forbid setting `User-Agent` from fetch(), so we also send
// `Api-User-Agent`, which Wikimedia honors for CORS/browser clients. Sending
// both means the same helper works client-side (useDestinationImage) and
// server-side (the item-info route, where User-Agent actually takes effect).
const UA = 'WanderTravelApp/1.0 (+https://wander-travel-app-jade.vercel.app)'

export const WIKI_HEADERS: Record<string, string> = {
  'User-Agent': UA,
  'Api-User-Agent': UA,
}

/** fetch() for Wikipedia/Wikimedia Commons endpoints, with the required UA headers. */
export function wikiFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, { ...init, headers: { ...WIKI_HEADERS, ...init?.headers } })
}
