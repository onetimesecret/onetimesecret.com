# BunnyCDN Edge Middleware

This directory contains edge scripts for deployment to BunnyCDN's edge network.

## Overview

Edge middleware runs at the CDN edge (close to users) before responses reach the client. This enables:
- Zero-latency personalization
- No additional network requests
- No CORS issues
- Efficient caching per region/country

## Scripts

### bunnycdn-country-injection.ts

Automatically injects the user's country code into HTML responses for geolocation-based jurisdiction selection.

**Features:**
- ✅ Detects country from BunnyCDN request context (`request.cf.country`)
- ✅ Injects `window.__USER_COUNTRY__` into HTML before `</head>`
- ✅ Caches responses per country using `Vary: CF-IPCountry` header
- ✅ Only processes HTML responses (skips static assets)
- ✅ Falls back to 'US' if country code unavailable

**How it works:**
1. BunnyCDN receives a request and determines the user's country from their IP
2. Edge script fetches the HTML from origin (if not cached)
3. Script injects country code into the HTML as a global variable
4. Modified HTML is served to the user
5. Subsequent requests from the same country use the cached version

## Deployment Instructions

### 1. Prepare the Script

The TypeScript file needs to be transpiled to JavaScript before deployment:

```bash
# Install dependencies if not already installed
pnpm install

# Build the edge script (you may need to set up a build script)
# For now, you can manually convert or use an online TypeScript compiler
```

### 2. Deploy to BunnyCDN

1. **Log in to BunnyCDN Dashboard**
   - Navigate to: https://panel.bunny.net/

2. **Access Pull Zone Settings**
   - Go to "Pull Zones" → Select your pull zone
   - Navigate to "Edge Script" tab

3. **Upload the Script**
   - Copy the contents of `bunnycdn-country-injection.ts` (converted to JS)
   - Paste into the Edge Script editor
   - Click "Save & Deploy"

4. **Enable the Edge Script**
   - Toggle "Enable Edge Script" switch
   - Save changes

### 3. Verify Deployment

Test the deployment by checking if the country code is injected:

```bash
# From different geographic locations or using a VPN
curl -I https://your-domain.com/

# Check the response contains the injection:
curl https://your-domain.com/ | grep "__USER_COUNTRY__"
```

You should see something like:
```html
<script data-user-country="US">window.__USER_COUNTRY__='US';</script>
```

### 4. Monitor Performance

- **BunnyCDN Analytics**: Check request counts and cache hit rates
- **Browser DevTools**: Verify country code is available in console
- **Sentry**: Monitor for any errors in jurisdiction detection

## Client-Side Usage

The injected country code is automatically used by the jurisdiction detection system:

```typescript
// In your Vue components (already implemented)
import { useJurisdiction } from '@/composables/useJurisdiction';

const { detectJurisdiction, autoSelectJurisdiction } = useJurisdiction();

// Option 1: Detect and suggest (shows banner to user)
await detectJurisdiction();

// Option 2: Auto-select without prompting
await autoSelectJurisdiction();
```

The country code is read from:
```javascript
const countryCode = window.__USER_COUNTRY__; // Injected by edge script
```

## Country to Jurisdiction Mapping

The mapping is defined in `src/utils/countryToJurisdiction.ts` with comprehensive global coverage (200+ countries):

- **EU** (~120 countries): Europe (all EU/EEA/EFTA + UK), Eastern Europe & Balkans, Russia, Turkey & Caucasus, Central Asia, Middle East, North Africa, Sub-Saharan Africa
- **CA** (2 countries): Canada, Greenland
- **NZ** (~50 countries): Asia-Pacific region including Australia, New Zealand, Pacific Islands, Southeast Asia, East Asia (China, Japan, Korea), South Asia (India, Pakistan)
- **US** (~50 countries): All of the Americas - North America, Central America, South America, Caribbean (default fallback for unmapped countries)

**Routing decisions based on:**
- Geographic proximity for optimal latency
- Data sovereignty and privacy regulations
- Political and economic relationships
- Network infrastructure and CDN performance

See `src/utils/countryToJurisdiction.ts` for the complete mapping of all 200+ countries.

## Caching Strategy

The edge script uses the `Vary: CF-IPCountry` header to cache separate versions per country:

- **First request from US**: Edge script runs, HTML modified, cached
- **Subsequent US requests**: Served from cache (no script execution)
- **First request from UK**: Edge script runs, HTML modified, cached separately
- **Subsequent UK requests**: Served from cache

This means:
- ⚡ Low latency (cache hit rate ~99%+)
- 💰 Low compute costs (script runs once per country per page)
- 🔒 No CORS issues (same-origin)

## Troubleshooting

### Country code not detected
- Check if edge script is enabled in BunnyCDN dashboard
- Verify script was deployed correctly
- Check browser console for `window.__USER_COUNTRY__`

### Wrong jurisdiction selected
- Review country mapping in `src/utils/countryToJurisdiction.ts`
- Test with different IP addresses/VPN locations
- Check BunnyCDN's country detection accuracy

### Performance issues
- Monitor cache hit rates in BunnyCDN analytics
- Verify `Vary` header is set correctly
- Check CDN edge server locations

## Development

### Local Testing

Use the provided test utilities for local development:

```typescript
// Import test utilities
import { mockCountryCode, testCountryCoverage } from './test-utils';

// Mock a specific country
mockCountryCode('GB'); // Test with UK
mockCountryCode('JP'); // Test with Japan
mockCountryCode('BR'); // Test with Brazil

// Run comprehensive tests
testCountryCoverage(); // Tests multiple countries
```

Or use browser console:

```javascript
// In browser console
window.__USER_COUNTRY__ = 'GB'; // Test with UK
// Then reload the page
```

### Testing

For comprehensive testing documentation, see [TESTING.md](./TESTING.md):
- Local development testing
- Unit testing examples
- Integration testing
- Production testing checklist
- Edge cases and error scenarios

## References

- [BunnyCDN Edge Script Documentation](https://docs.bunny.net/docs/edge-script-documentation)
- [BunnyCDN Edge Script Request Object](https://docs.bunny.net/docs/edge-script-request-object) - Access to country code via `request.cf.country`
- [HTTP Vary Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary)

## Support

For issues or questions:
1. Check BunnyCDN support documentation
2. Review application logs and Sentry
3. Contact BunnyCDN support for edge-specific issues
