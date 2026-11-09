// Picks an emoji for a place, dish or travel vibe from words in its name.
// Suggestions come from the AI and the cache as plain strings, so this works
// on any destination without asking the model for anything new.

export type ItemKind = 'see' | 'eat' | 'vibe'

type Rule = [RegExp, string]

const SEE: Rule[] = [
  [/beach|playa|praia|plage|bay|cove|lagoon/, '🏖️'],
  [/island|isla|ilha|atoll/, '🏝️'],
  [/volcano|crater/, '🌋'],
  [/mount|mt\.?\s|peak|summit|volcan|alps|hill/, '⛰️'],
  [/waterfall|falls|cascade/, '💦'],
  [/lake|river|canal|fjord|harbou?r|port|pier|waterfront|riverside/, '🌊'],
  [/park|garden|jard|botanic|forest|woods|reserve|valley|gorge|canyon|day trip|national/, '🏞️'],
  [/temple|shrine|pagoda|wat\b|stupa/, '🛕'],
  [/mosque|masjid/, '🕌'],
  [/cathedral|church|basilica|chapel|monastery|abbey|convent|sagrada/, '⛪'],
  [/synagogue/, '🕍'],
  [/castle|palace|fort|citadel|alcazar|kremlin|tower|torre|chateau|château/, '🏰'],
  [/museum|gallery|museu|musée|museo|louvre|art\b/, '🖼️'],
  [/bridge|ponte|puente|pont\b/, '🌉'],
  [/market|mercado|bazaar|souk|mercat|food hall/, '🛍️'],
  [/ruin|ancient|forum|colosseum|acropolis|pyramid|amphitheat|roman/, '🏛️'],
  [/square|plaza|praça|piazza|place\b/, '⛲'],
  [/street|old town|quarter|district|neighbou?rhood|alfama|medina|village|barrio/, '🏘️'],
  [/viewpoint|miradouro|mirador|lookout|observ|skyline|rooftop/, '🌅'],
  [/factory|warehouse|industrial/, '🏭'],
  [/opera|theat|concert|music|fado|jazz/, '🎭'],
  [/zoo|safari|wildlife|aquarium/, '🦁'],
  [/ski|snow|glacier/, '🏔️'],
  [/desert|dune|sahara/, '🏜️'],
  [/station|railway|tram|cable car|funicular/, '🚋'],
]

const EAT: Rule[] = [
  [/coffee|café|cafe|espresso|kopi/, '☕'],
  [/tea\b|matcha|chai/, '🍵'],
  [/wine|vinho|vino|port wine|sangria/, '🍷'],
  [/beer|ale\b|lager|cerveza/, '🍺'],
  [/cocktail|mojito|pisco|caipirinha|spritz/, '🍸'],
  [/ice cream|gelato|sorbet/, '🍨'],
  [/cake|pastel|pastry|tart|pie|croissant|baklava|churro|dessert|sweet|cookie|waffle|crepe|crêpe/, '🥐'],
  [/chocolate|cacao/, '🍫'],
  [/sushi|sashimi|nigiri/, '🍣'],
  [/ramen|pho|noodle|udon|soba|pad thai|laksa|lo mein/, '🍜'],
  [/dumpling|gyoza|bao|momo|dim sum|pierogi|xiaolongbao/, '🥟'],
  [/curry|masala|dal\b|biryani|vindaloo|korma/, '🍛'],
  [/rice|paella|risotto|pilaf|nasi/, '🍚'],
  [/pizza/, '🍕'],
  [/pasta|spaghetti|lasagn|ravioli|carbonara|gnocchi/, '🍝'],
  [/taco|burrito|quesadilla|tamale|enchilada|tlayuda/, '🌮'],
  [/burger/, '🍔'],
  [/sandwich|bifana|bocadillo|banh mi|panini|toast/, '🥪'],
  [/soup|stew|broth|chowder|gazpacho|borscht|caldo/, '🍲'],
  [/salad/, '🥗'],
  [/oyster|shrimp|prawn|lobster|crab|clam|mussel|squid|octopus|calamari|seafood/, '🦐'],
  [/fish|sardine|bacalhau|cod|salmon|tuna|ceviche|anchov/, '🐟'],
  [/chicken|poultry|duck/, '🍗'],
  [/steak|beef|lamb|pork|kebab|grill|bbq|barbecue|asado|sausage|chorizo|ham|jamón|souvlaki|gyro/, '🍖'],
  [/cheese|fondue|raclette/, '🧀'],
  [/bread|baguette|pretzel|flatbread|naan|pita/, '🥖'],
  [/egg|omelet|tortilla/, '🍳'],
  [/fruit|mango|banana|coconut|papaya/, '🥭'],
  [/mole|chili|chile|spicy/, '🌶️'],
]

const VIBE: Rule[] = [
  [/food|culinary|gastro|eat|dining/, '🍽️'],
  [/beach|coast|sea|ocean|surf|island/, '🌊'],
  [/night|party|club|bar\b/, '🌙'],
  [/history|historic|old town|heritage|ancient|culture/, '🏛️'],
  [/art|museum|design|architecture/, '🎨'],
  [/hik|trek|mountain|outdoor|nature|adventure/, '🥾'],
  [/romance|romantic|honeymoon|couple/, '💕'],
  [/family|kids|children/, '👨‍👩‍👧'],
  [/shop|market/, '🛍️'],
  [/relax|wellness|spa|slow|calm/, '🧘'],
  [/music|festival/, '🎶'],
  [/wine/, '🍷'],
  [/photo|view|scenery|scenic/, '📸'],
  [/budget|cheap|value/, '💸'],
  [/luxury/, '💎'],
  [/ski|snow|winter/, '⛷️'],
  [/wildlife|safari|animal/, '🐘'],
]

const FALLBACK: Record<ItemKind, string> = { see: '📍', eat: '🍽️', vibe: '✨' }

const RULES: Record<ItemKind, Rule[]> = { see: SEE, eat: EAT, vibe: VIBE }

export function emojiFor(label: string, kind: ItemKind): string {
  const text = label.toLowerCase()
  for (const [pattern, emoji] of RULES[kind]) {
    if (pattern.test(text)) return emoji
  }
  return FALLBACK[kind]
}

const WEATHER: Record<string, string> = {
  Clear: '☀️', Clouds: '⛅', Rain: '🌧️', Drizzle: '🌦️',
  Snow: '❄️', Thunderstorm: '⛈️', Mist: '🌫️', Fog: '🌫️', Haze: '🌫️',
}

export function weatherEmoji(condition: string | undefined): string {
  return (condition && WEATHER[condition]) || '🌡️'
}
