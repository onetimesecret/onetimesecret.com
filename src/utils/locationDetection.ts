/**
 * Location detection utilities using BunnyCDN geolocation headers
 */

/**
 * Map of jurisdictions to their corresponding country codes
 */
export const JURISDICTIONS = {
  EU: [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
    'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
    'SI', 'ES', 'SE',
  ],
  CA: ['CA'],
  NZ: ['NZ'],
  US: ['US'],
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
 * Get jurisdiction code from country code
 * @param countryCode ISO 3166-1 alpha-2 country code (e.g., 'US', 'DE')
 * @returns Jurisdiction code (e.g., 'US', 'EU') or null if not found
 */
export function getJurisdiction(countryCode: string): JurisdictionCode | null {
  if (!countryCode) return null;

  const upperCode = countryCode.toUpperCase();

  for (const [jurisdiction, countries] of Object.entries(JURISDICTIONS) as Array<
    [JurisdictionCode, readonly string[]]
  >) {
    if (countries.includes(upperCode)) {
      return jurisdiction;
    }
  }

  return null;
}

/**
 * Detect user location using BunnyCDN X-User-Country header
 * Makes a request to a known resource to get the header
 * @returns LocationDetectionResult with country code and jurisdiction
 */
export async function detectLocationFromBunnyCDN(): Promise<LocationDetectionResult> {
  try {
    // Make a HEAD request to the current domain to get headers
    // BunnyCDN will include X-User-Country header if configured
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
        error: 'X-User-Country header not found. BunnyCDN may not be configured.',
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
