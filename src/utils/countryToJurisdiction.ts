/**
 * Country Code to Jurisdiction Mapping
 *
 * Maps ISO 3166-1 alpha-2 country codes to jurisdiction identifiers.
 * This enables automatic jurisdiction selection based on user's country.
 *
 * Jurisdiction assignments follow data sovereignty and privacy regulations:
 * - EU: European Union member states + GDPR-compliant countries
 * - CA: Canada
 * - NZ: New Zealand and Pacific nations
 * - US: United States and other countries (default)
 */

/**
 * Maps country codes to jurisdiction identifiers
 */
export const COUNTRY_TO_JURISDICTION: Record<string, string> = {
  // European Union member states
  AT: 'EU', // Austria
  BE: 'EU', // Belgium
  BG: 'EU', // Bulgaria
  HR: 'EU', // Croatia
  CY: 'EU', // Cyprus
  CZ: 'EU', // Czech Republic
  DK: 'EU', // Denmark
  EE: 'EU', // Estonia
  FI: 'EU', // Finland
  FR: 'EU', // France
  DE: 'EU', // Germany
  GR: 'EU', // Greece
  HU: 'EU', // Hungary
  IE: 'EU', // Ireland
  IT: 'EU', // Italy
  LV: 'EU', // Latvia
  LT: 'EU', // Lithuania
  LU: 'EU', // Luxembourg
  MT: 'EU', // Malta
  NL: 'EU', // Netherlands
  PL: 'EU', // Poland
  PT: 'EU', // Portugal
  RO: 'EU', // Romania
  SK: 'EU', // Slovakia
  SI: 'EU', // Slovenia
  ES: 'EU', // Spain
  SE: 'EU', // Sweden

  // EEA countries (non-EU but follow GDPR)
  IS: 'EU', // Iceland
  LI: 'EU', // Liechtenstein
  NO: 'EU', // Norway

  // Other European countries with strong privacy laws
  CH: 'EU', // Switzerland
  GB: 'EU', // United Kingdom (post-Brexit GDPR equivalent)

  // Canada
  CA: 'CA',

  // New Zealand and Pacific
  NZ: 'NZ',
  AU: 'NZ', // Australia (closest jurisdiction)
  FJ: 'NZ', // Fiji
  PG: 'NZ', // Papua New Guinea
  NC: 'NZ', // New Caledonia
  PF: 'NZ', // French Polynesia
  WS: 'NZ', // Samoa
  TO: 'NZ', // Tonga
  VU: 'NZ', // Vanuatu

  // United States
  US: 'US',

  // Default fallback for all other countries is handled by the function below
};

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
 * Detect user's country code from BunnyCDN edge injection
 * @returns Country code or null if not available
 */
export function detectUserCountry(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Try to get from injected global variable
  const countryCode = (window as Window & { __USER_COUNTRY__?: string }).__USER_COUNTRY__;

  if (countryCode && typeof countryCode === 'string') {
    return countryCode;
  }

  // Try to get from data attribute (alternative injection method)
  const scriptElement = document.querySelector('script[data-user-country]');
  if (scriptElement) {
    const dataCountry = scriptElement.getAttribute('data-user-country');
    if (dataCountry) {
      return dataCountry;
    }
  }

  return null;
}
