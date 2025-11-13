/**
 * Location detection utilities using BunnyCDN geolocation
 * Supports both BunnySDK edge script and HTTP headers
 */

/**
 * Extend Window interface to include BunnySDK edge script variable
 */
declare global {
  interface Window {
    __USER_COUNTRY__?: string;
  }
}

/**
 * Comprehensive country-to-jurisdiction routing table
 * Organized by geographic/political region for maintainability
 *
 * Routing rationale:
 * - EU: Europe, MENA, Africa, Central Asia (GDPR alignment, cable proximity)
 * - CA: Canada + Greenland only
 * - NZ: Asia-Pacific region (geographic, low latency)
 * - US: All Americas except Canada (geographic, cultural ties)
 */
export const JURISDICTIONS = {
  EU: [
    // EU Member States (27)
    'AT',
    'BE',
    'BG',
    'HR',
    'CY',
    'CZ',
    'DK',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'HU',
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    'PL',
    'PT',
    'RO',
    'SK',
    'SI',
    'ES',
    'SE',

    // EFTA & Other Western Europe
    'NO',
    'CH',
    'IS',
    'LI',
    'GB',
    'MC',
    'SM',
    'VA',
    'AD',
    'GI',
    'GG',
    'IM',
    'JE',

    // Eastern Europe & Balkans
    'AL',
    'BA',
    'BY',
    'XK',
    'MD',
    'ME',
    'MK',
    'RS',
    'UA',
    'RU',

    // Turkey & Caucasus
    'TR',
    'AZ',
    'AM',
    'GE',

    // Central Asia
    'KZ',
    'UZ',
    'TM',
    'TJ',
    'KG',

    // Middle East
    'AE',
    'SA',
    'IL',
    'BH',
    'IQ',
    'IR',
    'JO',
    'KW',
    'LB',
    'OM',
    'PS',
    'QA',
    'SY',
    'YE',

    // North Africa
    'EG',
    'DZ',
    'MA',
    'TN',
    'LY',
    'SD',
    'MR',

    // Sub-Saharan Africa
    'ZA',
    'NG',
    'KE',
    'GH',
    'ET',
    'TZ',
    'UG',
    'AO',
    'CM',
    'CI',
    'MG',
    'ML',
    'MW',
    'MZ',
    'NE',
    'RW',
    'SN',
    'ZM',
    'ZW',
    'BW',
    'GA',
    'MU',
    'NA',
    'RE',
    'SC',
    'BF',
    'BI',
    'BJ',
    'CD',
    'CF',
    'CG',
    'DJ',
    'GN',
    'GM',
    'GW',
    'GQ',
    'LS',
    'LR',
    'SL',
    'SO',
    'SS',
    'ST',
    'SZ',
    'TD',
    'TG',
  ],

  CA: [
    'CA',
    'GL', // Greenland - Arctic proximity
  ],

  NZ: [
    'NZ',

    // Australia & Pacific Islands
    'AU',
    'FJ',
    'PG',
    'NC',
    'PF',
    'WS',
    'TO',
    'VU',
    'SB',
    'KI',
    'MH',
    'FM',
    'NR',
    'PW',
    'TV',
    'AS',
    'CK',
    'NU',
    'TK',
    'WF',

    // Southeast Asia
    'SG',
    'MY',
    'TH',
    'ID',
    'PH',
    'VN',
    'MM',
    'KH',
    'LA',
    'BN',
    'TL',

    // East Asia
    'JP',
    'KR',
    'CN',
    'HK',
    'MO',
    'TW',
    'MN',
    'KP',

    // South Asia
    'IN',
    'PK',
    'BD',
    'LK',
    'NP',
    'BT',
    'MV',
    'AF',
  ],

  US: [
    'US',

    // Mexico & Central America
    'MX',
    'GT',
    'HN',
    'SV',
    'NI',
    'CR',
    'PA',
    'BZ',

    // Caribbean
    'CU',
    'HT',
    'DO',
    'JM',
    'TT',
    'BS',
    'BB',
    'PR',
    'VI',
    'AW',
    'CW',
    'SX',
    'BQ',
    'AG',
    'DM',
    'GD',
    'KN',
    'LC',
    'VC',
    'BM',
    'KY',
    'TC',
    'VG',
    'AI',
    'MS',
    'BL',
    'MF',

    // South America
    'BR',
    'AR',
    'CO',
    'CL',
    'PE',
    'VE',
    'EC',
    'BO',
    'PY',
    'UY',
    'GY',
    'SR',
    'GF',

    // South Atlantic
    'FK',
    'GS',
    'PM',
    'GP',
    'MQ',
  ],
} as const;

export type JurisdictionCode = keyof typeof JURISDICTIONS;

/**
 * Result of location detection
 */
export interface LocationDetectionResult {
  countryCode: string | null;
  jurisdiction: JurisdictionCode | null;
  detected: boolean;
  error?: string;
}

/**
 * Pre-computed reverse lookup map for O(1) country-to-jurisdiction lookups
 * Built from JURISDICTIONS table at module load time
 */
const COUNTRY_TO_JURISDICTION = (Object.entries(JURISDICTIONS) as Array<
  [JurisdictionCode, readonly string[]]
>).reduce(
  (map, [jurisdiction, countries]) => {
    countries.forEach((country) => {
      map[country] = jurisdiction;
    });
    return map;
  },
  {} as Record<string, JurisdictionCode>
);

/**
 * Get jurisdiction code from country code using O(1) lookup
 * Falls back to EU for unknown countries (GDPR-compliant default)
 * @param countryCode ISO 3166-1 alpha-2 country code (e.g., 'US', 'DE')
 * @returns Jurisdiction code (e.g., 'US', 'EU')
 */
export function getJurisdiction(countryCode: string): JurisdictionCode {
  if (!countryCode) return 'EU';

  const upperCode = countryCode.toUpperCase();
  return COUNTRY_TO_JURISDICTION[upperCode] || 'EU';
}

/**
 * Detect user location using BunnyCDN edge script or X-User-Country header
 * Tries edge script first (window.__USER_COUNTRY__), then falls back to HTTP header
 * @returns LocationDetectionResult with country code and jurisdiction
 */
export async function detectLocationFromBunnyCDN(): Promise<LocationDetectionResult> {
  // Guard: Only run in browser environment
  if (typeof window === 'undefined') {
    return {
      countryCode: null,
      jurisdiction: null,
      detected: false,
      error: 'Not in browser environment',
    };
  }

  // Primary method: Check for BunnySDK edge script variable
  if (window.__USER_COUNTRY__) {
    const countryCode = window.__USER_COUNTRY__;
    const jurisdiction = getJurisdiction(countryCode);

    return {
      countryCode,
      jurisdiction,
      detected: true,
    };
  }

  // Fallback method: Try HTTP header from Edge Rules
  try {
    // Make a HEAD request to the current domain to get headers
    // BunnyCDN will include X-User-Country header if Edge Rules are configured
    const response = await fetch(window.location.origin, {
      method: 'HEAD',
      cache: 'no-store', // Ensure we get fresh headers
    });

    // Get the country code from the X-User-Country header
    const countryCode = response.headers.get('X-User-Country');

    if (!countryCode) {
      return {
        countryCode: null,
        jurisdiction: null,
        detected: false,
        error: 'Neither edge script nor X-User-Country header found. BunnyCDN may not be configured.',
      };
    }

    const jurisdiction = getJurisdiction(countryCode);

    return {
      countryCode,
      jurisdiction,
      detected: true,
    };
  } catch (error) {
    return {
      countryCode: null,
      jurisdiction: null,
      detected: false,
      error: error instanceof Error ? error.message : 'Unknown error during location detection',
    };
  }
}

/**
 * Detect user location with retry logic for network errors
 * @param maxRetries Maximum number of retry attempts (default: 2)
 * @param retryDelay Delay between retries in milliseconds (default: 1000)
 * @returns LocationDetectionResult
 */
export async function detectLocationWithRetry(
  maxRetries = 2,
  retryDelay = 1000
): Promise<LocationDetectionResult> {
  let lastError: LocationDetectionResult | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await detectLocationFromBunnyCDN();

    // If detection succeeded, return immediately
    if (result.detected) {
      return result;
    }

    // Store the error for potential return
    lastError = result;

    // If this wasn't the last attempt, wait before retrying
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // Return the last error result
  return lastError || {
    countryCode: null,
    jurisdiction: null,
    detected: false,
    error: 'All retry attempts failed',
  };
}

/**
 * Check if we're likely on a VPN by comparing detected location
 * with the current domain jurisdiction
 * @param detectedJurisdiction The jurisdiction detected from location
 * @param currentDomain The current domain (e.g., 'eu.onetimesecret.com')
 * @returns true if there's a mismatch suggesting VPN usage
 */
export function isProbablyVPN(
  detectedJurisdiction: JurisdictionCode | null,
  currentDomain: string
): boolean {
  if (!detectedJurisdiction) return false;

  // Extract jurisdiction from domain (e.g., 'eu' from 'eu.onetimesecret.com')
  const domainJurisdiction = currentDomain.split('.')[0]?.toUpperCase();

  return detectedJurisdiction !== domainJurisdiction;
}
