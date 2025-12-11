/**
 * Testing Utilities for BunnyCDN Edge Middleware
 *
 * This file provides utilities for testing country-based jurisdiction detection
 * both locally and in production environments.
 */

/**
 * Mock country code injection for local development and testing
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @example
 * // In browser console or test setup
 * mockCountryCode('GB'); // Test with UK
 * mockCountryCode('JP'); // Test with Japan
 */
export function mockCountryCode(countryCode: string): void {
  if (typeof window === 'undefined') {
    console.warn('mockCountryCode can only be used in browser environment');
    return;
  }

  // Inject as global variable
  (window as Window & { __USER_COUNTRY__?: string }).__USER_COUNTRY__ =
    countryCode.toUpperCase();

  // Also inject as data attribute for alternative detection method
  let scriptElement = document.querySelector('script[data-user-country]');

  if (!scriptElement) {
    scriptElement = document.createElement('script');
    scriptElement.setAttribute('data-user-country', countryCode.toUpperCase());
    document.head.appendChild(scriptElement);
  } else {
    scriptElement.setAttribute('data-user-country', countryCode.toUpperCase());
  }

  console.log(`✅ Mocked country code: ${countryCode.toUpperCase()}`);
}

/**
 * Clear mocked country code
 */
export function clearMockCountryCode(): void {
  if (typeof window === 'undefined') return;

  delete (window as Window & { __USER_COUNTRY__?: string }).__USER_COUNTRY__;

  const scriptElement = document.querySelector('script[data-user-country]');
  if (scriptElement) {
    scriptElement.remove();
  }

  console.log('✅ Cleared mocked country code');
}

/**
 * Test country-to-jurisdiction mapping
 * @param countryCode - Country code to test
 * @returns Expected jurisdiction or error message
 */
export function testCountryMapping(countryCode: string): string {
  // Import mapping dynamically to avoid build-time dependencies
  const COUNTRY_ROUTING: Record<string, string[]> = {
    EU: [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
      'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
      'SI', 'ES', 'SE', 'NO', 'CH', 'IS', 'LI', 'GB', 'MC', 'SM', 'VA', 'AD',
      'GI', 'GG', 'IM', 'JE', 'AL', 'BA', 'BY', 'XK', 'MD', 'ME', 'MK', 'RS',
      'UA', 'RU', 'TR', 'AZ', 'AM', 'GE', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'AE',
      'SA', 'IL', 'BH', 'IQ', 'IR', 'JO', 'KW', 'LB', 'OM', 'PS', 'QA', 'SY',
      'YE', 'EG', 'DZ', 'MA', 'TN', 'LY', 'SD', 'MR', 'ZA', 'NG', 'KE', 'GH',
      'ET', 'TZ', 'UG', 'AO', 'CM', 'CI', 'MG', 'ML', 'MW', 'MZ', 'NE', 'RW',
      'SN', 'ZM', 'ZW', 'BW', 'GA', 'MU', 'NA', 'RE', 'SC', 'BF', 'BI', 'BJ',
      'CD', 'CF', 'CG', 'DJ', 'GN', 'GM', 'GW', 'GQ', 'LS', 'LR', 'SL', 'SO',
      'SS', 'ST', 'SZ', 'TD', 'TG',
    ],
    CA: ['CA', 'GL'],
    NZ: [
      'NZ', 'AU', 'FJ', 'PG', 'NC', 'PF', 'WS', 'TO', 'VU', 'SB', 'KI', 'MH',
      'FM', 'NR', 'PW', 'TV', 'AS', 'CK', 'NU', 'TK', 'WF', 'SG', 'MY', 'TH',
      'ID', 'PH', 'VN', 'MM', 'KH', 'LA', 'BN', 'TL', 'JP', 'KR', 'CN', 'HK',
      'MO', 'TW', 'MN', 'KP', 'IN', 'PK', 'BD', 'LK', 'NP', 'BT', 'MV', 'AF',
    ],
    US: [
      'US', 'MX', 'GT', 'HN', 'SV', 'NI', 'CR', 'PA', 'BZ', 'CU', 'HT', 'DO',
      'JM', 'TT', 'BS', 'BB', 'PR', 'VI', 'AW', 'CW', 'SX', 'BQ', 'AG', 'DM',
      'GD', 'KN', 'LC', 'VC', 'BM', 'KY', 'TC', 'VG', 'AI', 'MS', 'BL', 'MF',
      'BR', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY', 'GY', 'SR',
      'GF', 'FK', 'GS', 'PM', 'GP', 'MQ',
    ],
  };

  const normalized = countryCode.toUpperCase();

  for (const [jurisdiction, countries] of Object.entries(COUNTRY_ROUTING)) {
    if (countries.includes(normalized)) {
      return jurisdiction;
    }
  }

  return 'US'; // Default
}

/**
 * Batch test multiple country codes
 */
export function testCountryCoverage(): void {
  const testCases = [
    { code: 'US', expected: 'US' },
    { code: 'GB', expected: 'EU' },
    { code: 'DE', expected: 'EU' },
    { code: 'CA', expected: 'CA' },
    { code: 'AU', expected: 'NZ' },
    { code: 'JP', expected: 'NZ' },
    { code: 'BR', expected: 'US' },
    { code: 'SG', expected: 'NZ' },
    { code: 'ZA', expected: 'EU' },
    { code: 'MX', expected: 'US' },
  ];

  console.log('🧪 Testing country-to-jurisdiction mapping:');
  console.log('━'.repeat(50));

  let passed = 0;
  let failed = 0;

  testCases.forEach(({ code, expected }) => {
    const result = testCountryMapping(code);
    const status = result === expected ? '✅' : '❌';

    if (result === expected) {
      passed++;
    } else {
      failed++;
    }

    console.log(`${status} ${code} → ${result} (expected: ${expected})`);
  });

  console.log('━'.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
}

/**
 * Example: Manual testing in browser console
 *
 * Open browser console and run:
 *
 * ```javascript
 * // Test with different countries
 * mockCountryCode('GB');  // Test UK → EU
 * mockCountryCode('JP');  // Test Japan → NZ
 * mockCountryCode('BR');  // Test Brazil → US
 * mockCountryCode('CA');  // Test Canada → CA
 *
 * // Then reload the page to see jurisdiction detection in action
 *
 * // Run coverage tests
 * testCountryCoverage();
 * ```
 */

// Browser-friendly exports for console testing
if (typeof window !== 'undefined') {
  (window as typeof window & {
    mockCountryCode?: typeof mockCountryCode;
    clearMockCountryCode?: typeof clearMockCountryCode;
    testCountryMapping?: typeof testCountryMapping;
    testCountryCoverage?: typeof testCountryCoverage;
  }).mockCountryCode = mockCountryCode;
  (window as typeof window & {
    mockCountryCode?: typeof mockCountryCode;
    clearMockCountryCode?: typeof clearMockCountryCode;
    testCountryMapping?: typeof testCountryMapping;
    testCountryCoverage?: typeof testCountryCoverage;
  }).clearMockCountryCode = clearMockCountryCode;
  (window as typeof window & {
    mockCountryCode?: typeof mockCountryCode;
    clearMockCountryCode?: typeof clearMockCountryCode;
    testCountryMapping?: typeof testCountryMapping;
    testCountryCoverage?: typeof testCountryCoverage;
  }).testCountryMapping = testCountryMapping;
  (window as typeof window & {
    mockCountryCode?: typeof mockCountryCode;
    clearMockCountryCode?: typeof clearMockCountryCode;
    testCountryMapping?: typeof testCountryMapping;
    testCountryCoverage?: typeof testCountryCoverage;
  }).testCountryCoverage = testCountryCoverage;
}
