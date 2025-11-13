# Testing Guide for Country-Based Jurisdiction Detection

This guide covers testing strategies for the BunnyCDN edge middleware and country-based jurisdiction detection system.

## Table of Contents

1. [Local Development Testing](#local-development-testing)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [Production Testing](#production-testing)
5. [Edge Cases & Error Scenarios](#edge-cases--error-scenarios)

---

## Local Development Testing

### Browser Console Testing

The easiest way to test jurisdiction detection locally is using the browser console:

```javascript
// 1. Mock a country code
mockCountryCode('GB'); // Test UK → EU jurisdiction

// 2. Reload the page to see the detection in action

// 3. Check detected jurisdiction
console.log(window.__USER_COUNTRY__); // Should show 'GB'

// 4. Test different countries
mockCountryCode('JP'); // Japan → NZ
mockCountryCode('BR'); // Brazil → US
mockCountryCode('CA'); // Canada → CA
```

### Testing Utilities

Import and use the test utilities in your code:

```typescript
import { mockCountryCode, testCountryCoverage } from '@/edge/test-utils';

// Mock a specific country
mockCountryCode('DE'); // Germany → EU

// Run comprehensive coverage tests
testCountryCoverage(); // Tests 10+ countries
```

### Manual Testing Checklist

- [ ] **US jurisdiction**: Mock 'US', verify US server selected
- [ ] **EU jurisdiction**: Mock 'GB', 'DE', 'FR' - verify EU server
- [ ] **CA jurisdiction**: Mock 'CA', 'GL' - verify CA server
- [ ] **NZ jurisdiction**: Mock 'AU', 'JP', 'SG' - verify NZ server
- [ ] **Unknown country**: Mock 'XX' - verify fallback to US
- [ ] **Invalid format**: Mock '123' - verify rejection and fallback

---

## Unit Testing

### Country Mapping Tests

Create tests for the country-to-jurisdiction mapping:

```typescript
// tests/utils/countryToJurisdiction.test.ts
import { describe, expect, test } from 'vitest';
import { getJurisdictionForCountry } from '@/utils/countryToJurisdiction';

describe('countryToJurisdiction', () => {
  describe('EU jurisdiction', () => {
    test('maps EU member states correctly', () => {
      expect(getJurisdictionForCountry('DE')).toBe('EU');
      expect(getJurisdictionForCountry('FR')).toBe('EU');
      expect(getJurisdictionForCountry('GB')).toBe('EU');
    });

    test('maps Middle East countries to EU', () => {
      expect(getJurisdictionForCountry('AE')).toBe('EU');
      expect(getJurisdictionForCountry('SA')).toBe('EU');
      expect(getJurisdictionForCountry('IL')).toBe('EU');
    });

    test('maps African countries to EU', () => {
      expect(getJurisdictionForCountry('ZA')).toBe('EU');
      expect(getJurisdictionForCountry('NG')).toBe('EU');
      expect(getJurisdictionForCountry('KE')).toBe('EU');
    });
  });

  describe('NZ jurisdiction', () => {
    test('maps Asia-Pacific countries correctly', () => {
      expect(getJurisdictionForCountry('AU')).toBe('NZ');
      expect(getJurisdictionForCountry('NZ')).toBe('NZ');
      expect(getJurisdictionForCountry('SG')).toBe('NZ');
    });

    test('maps East Asian countries to NZ', () => {
      expect(getJurisdictionForCountry('JP')).toBe('NZ');
      expect(getJurisdictionForCountry('KR')).toBe('NZ');
      expect(getJurisdictionForCountry('CN')).toBe('NZ');
    });

    test('maps South Asian countries to NZ', () => {
      expect(getJurisdictionForCountry('IN')).toBe('NZ');
      expect(getJurisdictionForCountry('PK')).toBe('NZ');
    });
  });

  describe('US jurisdiction', () => {
    test('maps Americas countries correctly', () => {
      expect(getJurisdictionForCountry('US')).toBe('US');
      expect(getJurisdictionForCountry('MX')).toBe('US');
      expect(getJurisdictionForCountry('BR')).toBe('US');
    });
  });

  describe('CA jurisdiction', () => {
    test('maps Canada and Greenland', () => {
      expect(getJurisdictionForCountry('CA')).toBe('CA');
      expect(getJurisdictionForCountry('GL')).toBe('CA');
    });
  });

  describe('edge cases', () => {
    test('handles unknown country codes', () => {
      expect(getJurisdictionForCountry('XX')).toBe('US');
      expect(getJurisdictionForCountry('ZZ')).toBe('US');
    });

    test('handles lowercase input', () => {
      expect(getJurisdictionForCountry('us')).toBe('US');
      expect(getJurisdictionForCountry('gb')).toBe('EU');
    });

    test('handles invalid input', () => {
      expect(getJurisdictionForCountry('')).toBe('US');
      expect(getJurisdictionForCountry('123')).toBe('US');
    });
  });
});
```

### Country Detection Tests

```typescript
// tests/utils/detectUserCountry.test.ts
import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { detectUserCountry } from '@/utils/countryToJurisdiction';

describe('detectUserCountry', () => {
  beforeEach(() => {
    // Clean up any existing country code
    delete (window as any).__USER_COUNTRY__;
    document.querySelector('script[data-user-country]')?.remove();
  });

  afterEach(() => {
    // Clean up after tests
    delete (window as any).__USER_COUNTRY__;
    document.querySelector('script[data-user-country]')?.remove();
  });

  test('detects country from window global', () => {
    (window as any).__USER_COUNTRY__ = 'US';
    expect(detectUserCountry()).toBe('US');
  });

  test('detects country from data attribute', () => {
    const script = document.createElement('script');
    script.setAttribute('data-user-country', 'GB');
    document.head.appendChild(script);

    expect(detectUserCountry()).toBe('GB');
  });

  test('normalizes lowercase to uppercase', () => {
    (window as any).__USER_COUNTRY__ = 'us';
    expect(detectUserCountry()).toBe('US');
  });

  test('validates country code format', () => {
    (window as any).__USER_COUNTRY__ = '123';
    expect(detectUserCountry()).toBeNull();
  });

  test('returns null when not available', () => {
    expect(detectUserCountry()).toBeNull();
  });
});
```

---

## Integration Testing

### Component Testing

Test that Vue components properly use jurisdiction detection:

```typescript
// tests/components/Homepage.test.ts
import { describe, expect, test, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Homepage from '@/components/vue/homepage/Homepage.vue';

describe('Homepage jurisdiction detection', () => {
  beforeEach(() => {
    // Mock country code
    (window as any).__USER_COUNTRY__ = 'GB';
  });

  test('detects jurisdiction on mount', async () => {
    const wrapper = mount(Homepage, {
      props: {
        locale: 'en',
        initialMessages: {},
      },
    });

    // Wait for async detection
    await wrapper.vm.$nextTick();

    // Verify jurisdiction was detected
    // (Implementation depends on your component structure)
  });
});
```

---

## Production Testing

### Pre-Deployment Checklist

Before deploying to BunnyCDN:

1. **Verify Edge Script**
   - [ ] Edge script compiles without TypeScript errors
   - [ ] Error handling is in place
   - [ ] Country code validation works
   - [ ] Sanitization prevents XSS

2. **Verify Client Code**
   - [ ] Country detection works in all browsers
   - [ ] Fallback to US works when country unavailable
   - [ ] No console errors on page load
   - [ ] Works with JavaScript disabled (graceful degradation)

3. **Performance**
   - [ ] No significant page load impact
   - [ ] CDN caching working (check Vary header)
   - [ ] No memory leaks

### Post-Deployment Testing

After deploying to BunnyCDN:

```bash
# 1. Test from different geographic locations (use VPN or proxies)
curl -I https://onetimesecret.com/

# 2. Verify country code injection
curl https://onetimesecret.com/ | grep "__USER_COUNTRY__"

# Expected output:
# <script data-user-country="US">window.__USER_COUNTRY__='US';</script>

# 3. Test cache headers
curl -I https://onetimesecret.com/ | grep "Vary"
# Expected: Vary: CF-IPCountry

# 4. Test from different countries
# Use a VPN or proxy service:
curl -x uk-proxy.example.com https://onetimesecret.com/ | grep "__USER_COUNTRY__"
# Expected: GB, DE, FR, etc.
```

### Monitoring

Set up monitoring for:

1. **Edge Script Errors**
   - Check BunnyCDN logs for edge script failures
   - Set up alerts for high error rates

2. **Jurisdiction Distribution**
   - Monitor which jurisdictions users are being routed to
   - Verify distribution matches expected geographic traffic

3. **Performance Metrics**
   - Track page load times across jurisdictions
   - Monitor cache hit rates per country

---

## Edge Cases & Error Scenarios

### Test Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| **No country code** | Falls back to US (default) |
| **Invalid format (123)** | Rejects, falls back to US |
| **Unknown country (XX)** | Falls back to US |
| **Lowercase country (us)** | Normalizes to uppercase (US) |
| **Edge script error** | Returns original response, site still works |
| **HTML without `</head>`** | Injects at start of `<body>` |
| **Non-HTML response** | Passes through unchanged |
| **XSS attempt** | Sanitized, injection prevented |

### Testing Error Scenarios

```javascript
// Test invalid country codes
mockCountryCode('123'); // Should reject
mockCountryCode('ABC'); // Should reject
mockCountryCode('1A');  // Should reject

// Test edge cases
mockCountryCode('');    // Should fallback to US
mockCountryCode('xx');  // Should fallback to US (unknown country)

// Test normalization
mockCountryCode('us');  // Should normalize to 'US'
mockCountryCode('Gb');  // Should normalize to 'GB'
```

### Manual Browser Testing

1. **Disable JavaScript**: Verify site still loads
2. **Clear cache**: Test fresh page loads
3. **Different browsers**: Test Chrome, Firefox, Safari, Edge
4. **Mobile devices**: Test on iOS and Android
5. **Slow connections**: Test with network throttling

---

## Continuous Testing

Add to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Test Country Detection

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:unit # Run unit tests
      - run: pnpm type-check # TypeScript checks
      - run: pnpm lint # Linting
```

---

## Troubleshooting

### Country code not detected
1. Check browser console for warnings
2. Verify edge script is deployed and enabled
3. Check BunnyCDN logs for errors
4. Try clearing browser cache

### Wrong jurisdiction selected
1. Verify country mapping in `countryToJurisdiction.ts`
2. Check if country code is correct: `console.log(window.__USER_COUNTRY__)`
3. Test mapping: `testCountryMapping('XX')`

### Performance issues
1. Check CDN cache hit rates
2. Verify Vary header is set
3. Monitor edge script execution time
4. Check for excessive re-renders

---

## Summary

✅ **Always test locally first** using browser console utilities
✅ **Write unit tests** for country mapping logic
✅ **Test edge cases** (invalid codes, unknown countries)
✅ **Monitor in production** using BunnyCDN analytics
✅ **Set up alerts** for errors and performance issues
