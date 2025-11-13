/**
 * Country Code to Jurisdiction Mapping
 *
 * Maps ISO 3166-1 alpha-2 country codes to jurisdiction identifiers.
 * This enables automatic jurisdiction selection based on user's country.
 *
 * Routing decisions are based on:
 * - Geographic proximity for optimal latency
 * - Data sovereignty and privacy regulations
 * - Political and economic relationships
 * - Network infrastructure and CDN performance
 *
 * Jurisdictions:
 * - EU: Europe, Middle East, Africa, Russia, Central Asia
 * - CA: Canada, Greenland
 * - NZ: Asia-Pacific (Australia, New Zealand, Southeast Asia, East Asia, South Asia)
 * - US: Americas (North, Central, South America, Caribbean) - Default fallback
 */

/**
 * Country routing configuration organized by geographic/political regions
 * This structure makes it easier to maintain and understand the routing logic
 */
const COUNTRY_ROUTING: Record<string, string[]> = {
  EU: [
    // EU Member States (27)
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
    'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
    'SI', 'ES', 'SE',

    // EFTA & Other Western Europe
    'NO', 'CH', 'IS', 'LI', 'GB', 'MC', 'SM', 'VA', 'AD', 'GI', 'GG', 'IM', 'JE',

    // Eastern Europe & Balkans
    'AL', 'BA', 'BY', 'XK', 'MD', 'ME', 'MK', 'RS', 'UA', 'RU',

    // Turkey & Caucasus
    'TR', 'AZ', 'AM', 'GE',

    // Central Asia
    'KZ', 'UZ', 'TM', 'TJ', 'KG',

    // Middle East
    'AE', 'SA', 'IL', 'BH', 'IQ', 'IR', 'JO', 'KW', 'LB', 'OM', 'PS', 'QA', 'SY', 'YE',

    // North Africa
    'EG', 'DZ', 'MA', 'TN', 'LY', 'SD', 'MR',

    // Sub-Saharan Africa
    'ZA', 'NG', 'KE', 'GH', 'ET', 'TZ', 'UG', 'AO', 'CM', 'CI', 'MG', 'ML', 'MW',
    'MZ', 'NE', 'RW', 'SN', 'ZM', 'ZW', 'BW', 'GA', 'MU', 'NA', 'RE', 'SC', 'BF',
    'BI', 'BJ', 'CD', 'CF', 'CG', 'DJ', 'GN', 'GM', 'GW', 'GQ', 'LS', 'LR', 'SL',
    'SO', 'SS', 'ST', 'SZ', 'TD', 'TG',
  ],

  CA: [
    'CA', // Canada
    'GL', // Greenland - Arctic proximity
  ],

  NZ: [
    'NZ', // New Zealand

    // Australia & Pacific Islands
    'AU', 'FJ', 'PG', 'NC', 'PF', 'WS', 'TO', 'VU', 'SB', 'KI', 'MH', 'FM', 'NR',
    'PW', 'TV', 'AS', 'CK', 'NU', 'TK', 'WF',

    // Southeast Asia
    'SG', 'MY', 'TH', 'ID', 'PH', 'VN', 'MM', 'KH', 'LA', 'BN', 'TL',

    // East Asia
    'JP', 'KR', 'CN', 'HK', 'MO', 'TW', 'MN', 'KP',

    // South Asia
    'IN', 'PK', 'BD', 'LK', 'NP', 'BT', 'MV', 'AF',
  ],

  US: [
    'US', // United States

    // Mexico & Central America
    'MX', 'GT', 'HN', 'SV', 'NI', 'CR', 'PA', 'BZ',

    // Caribbean
    'CU', 'HT', 'DO', 'JM', 'TT', 'BS', 'BB', 'PR', 'VI', 'AW', 'CW', 'SX', 'BQ',
    'AG', 'DM', 'GD', 'KN', 'LC', 'VC', 'BM', 'KY', 'TC', 'VG', 'AI', 'MS', 'BL', 'MF',

    // South America
    'BR', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY', 'GY', 'SR', 'GF',

    // South Atlantic
    'FK', 'GS', 'PM', 'GP', 'MQ',
  ],
};

/**
 * Reverse lookup map built from COUNTRY_ROUTING for O(1) performance
 * Maps country codes to jurisdiction identifiers
 */
export const COUNTRY_TO_JURISDICTION: Record<string, string> = Object.entries(
  COUNTRY_ROUTING
).reduce((map, [jurisdiction, countries]) => {
  countries.forEach((country) => {
    map[country] = jurisdiction;
  });
  return map;
}, {} as Record<string, string>);

/**
 * Get the appropriate jurisdiction identifier for a given country code
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Jurisdiction identifier (EU, CA, NZ, or US)
 */
export function getJurisdictionForCountry(countryCode: string): string {
  const normalized = countryCode.toUpperCase();
  return COUNTRY_TO_JURISDICTION[normalized] || 'US'; // Default to US
}

/**
 * Validates that a country code matches ISO 3166-1 alpha-2 format
 * @param code - Country code to validate
 * @returns true if valid, false otherwise
 */
function isValidCountryCode(code: string): boolean {
  // Must be exactly 2 uppercase letters
  return /^[A-Z]{2}$/.test(code);
}

/**
 * Detect user's country code from BunnyCDN edge injection
 * @returns Country code or null if not available or invalid
 */
export function detectUserCountry(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const isDebug = window.location.hostname.includes('.dev');

  // Get from injected global variable
  const countryCode = (window as Window & { __USER_COUNTRY__?: string }).__USER_COUNTRY__;

  if (isDebug) {
    console.log('[Country Detection] window.__USER_COUNTRY__:', countryCode);
    console.log('[Country Detection] Type:', typeof countryCode);
  }

  if (countryCode && typeof countryCode === 'string') {
    // Normalize to uppercase for consistency
    const normalized = countryCode.toUpperCase();

    if (isDebug) {
      console.log('[Country Detection] Normalized:', normalized);
    }

    // Validate ISO 3166-1 alpha-2 format
    if (isValidCountryCode(normalized)) {
      if (isDebug) {
        console.log('[Country Detection] Valid country code:', normalized);
      }
      return normalized;
    }

    // Log warning for debugging
    console.warn(`[Country Detection] Invalid country code format: ${countryCode}`);
  } else if (isDebug) {
    console.warn('[Country Detection] No country code found in window.__USER_COUNTRY__');
  }

  return null;
}
