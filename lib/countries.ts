// ISO 3166-1 alpha-2 codes for passport-issuing countries and territories.
// Names come from the browser's Intl.DisplayNames, so the list stays short.
const CODES = 'AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW'.split(' ')

export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

/** All countries as { code, name }, sorted by name. */
export function countryOptions(): { code: string; name: string }[] {
  return CODES.map(code => ({ code, name: countryName(code) })).sort((a, b) => a.name.localeCompare(b.name))
}

/** Official travel-advice pages from a few governments, for the destination country. */
export function advisoryLinks(countryName: string) {
  const slug = countryName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return [
    { label: 'UK FCDO', href: `https://www.gov.uk/foreign-travel-advice/${slug}` },
    { label: 'US State Dept', href: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html' },
    { label: 'Australia Smartraveller', href: `https://www.smartraveller.gov.au/destinations` },
  ]
}
