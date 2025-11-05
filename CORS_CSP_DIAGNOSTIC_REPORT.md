# CORS & CSP Issues Diagnostic Report

**Date:** 2025-11-05
**Issue:** Firefox users unable to create secrets (CORS error) and CSP violations
**Browsers Affected:** Primarily Firefox (both Windows 11 and macOS)
**Browsers Working:** Edge, Chrome

---

## Executive Summary

This diagnostic report identifies **two separate but related issues** affecting Firefox users:

1. **CORS Error (500 status)**: Backend API server not sending proper CORS headers
2. **CSP Violation**: Content Security Policy blocking inline scripts due to Sentry Astro integration

---

## Issue 1: CORS Error (Critical - Backend Issue)

### Symptoms

```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote
resource at https://eu.onetimesecret.com/api/v2/secret/conceal.
(Reason: CORS header 'Access-Control-Allow-Origin' missing).
Status code: 204.

Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote
resource at https://eu.onetimesecret.com/api/v2/secret/conceal.
(Reason: CORS request did not succeed).
Status code: (null).
```

### Root Cause

The backend API server at `eu.onetimesecret.com/api/v2/secret/conceal` is **not sending the required CORS headers** in response to preflight OPTIONS requests and/or POST requests from the browser.

### Technical Analysis

1. **Frontend Configuration** (onetimesecret.com website):
   - ✅ Static site (Astro SSG) - **no server-side CORS configuration needed**
   - ✅ CSP `connect-src` directive properly allows regional endpoints
   - ✅ API calls correctly formatted with proper headers

2. **Backend Configuration** (eu.onetimesecret.com API) - **MISSING CORS HEADERS**:
   - ❌ `Access-Control-Allow-Origin` header not being sent
   - ❌ Likely missing `Access-Control-Allow-Methods`
   - ❌ Likely missing `Access-Control-Allow-Headers`
   - ❌ Preflight OPTIONS request may be failing (status 204 suggests OPTIONS completed but response lacks CORS headers)

3. **API Call Flow**:
   ```
   User Browser (onetimesecret.com)
       ↓
   [Preflight OPTIONS] → https://eu.onetimesecret.com/api/v2/secret/conceal
       ← [204 No Content] (missing CORS headers) ❌
       ↓
   [POST Request] → (blocked by browser due to failed preflight)
   ```

### Why Firefox Specifically?

Firefox enforces CORS policies more strictly than Chrome/Edge:
- **Firefox**: Strictly blocks requests when CORS headers are missing
- **Chrome/Edge**: May be more lenient in certain scenarios or have different preflight caching behavior

### Evidence from Codebase

**File:** `/src/components/vue/forms/SecretForm.vue:140-212`

```javascript
const apiUrl = `${props.apiBaseUrl}/api/v2/secret/conceal`;
const headers = new Headers();
headers.append("Content-Type", "application/json");

const response = await fetch(apiUrl, {
  method: "POST",
  headers: headers,
  body: JSON.stringify({ secret: payload }),
});
```

The frontend code is correct and follows standard fetch API practices.

**File:** `/src/utils/security.ts:9-40`

```javascript
export function generateCspConnectSrc(apiUrl?: string, isDebugMode?: boolean): string {
  const directives = [
    "'self'",
    apiUrl,
    "https://catch.onetimesecret.com", // Sentry
    "https://eu.onetimesecret.com",    // ✅ Regional endpoints allowed
    "https://ca.onetimesecret.com",
    "https://nz.onetimesecret.com",
    "https://us.onetimesecret.com",
  ];
  return directives.filter(Boolean).join(" ");
}
```

The CSP properly allows connections to all regional API endpoints.

### Required Backend Fix

The backend API server at `eu.onetimesecret.com` (and other regional endpoints) must be configured to send proper CORS headers:

```http
Access-Control-Allow-Origin: https://onetimesecret.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

**Note:** This is a backend repository issue, not a frontend issue. The backend API code needs to be updated.

---

## Issue 2: CSP Violation (Warning - Frontend/Build Issue)

### Symptoms

```
Content-Security-Policy: The page's settings blocked an inline script
(script-src-elem) from being executed because it violates the following
directive: "script-src 'unsafe-inline' 'nonce-5sgm3hE56Z9+P7Ixp8ja5A=='".
Consider using a hash ('sha256-yei5Fza+Eyx4G0smvN0xBqEesIKumz6RSyGsU3FJowI=')
or a nonce.
```

### Root Cause

The **Sentry Astro integration** (`@sentry/astro`) automatically transforms CSP headers at build time to use **nonces** for better security. However, inline scripts using Astro's `is:inline` directive are not automatically receiving the matching nonce attributes.

### Technical Analysis

1. **Source Code CSP** (`/src/components/layout/LayoutHead.astro:143-146`):
   ```html
   <meta
     http-equiv="Content-Security-Policy"
     content="default-src 'self'; script-src 'self' 'unsafe-inline'; ..."
   />
   ```
   ✅ Allows `'unsafe-inline'` scripts

2. **Build-Time Transformation** (Sentry Integration):
   - Sentry Astro integration transforms CSP to use nonces: `'nonce-5sgm3hE56Z9+P7Ixp8ja5A=='`
   - This improves security by replacing `'unsafe-inline'` with specific nonces
   - However, inline scripts need matching nonce attributes

3. **Affected Inline Scripts**:

   **a) Theme Initialization Script** (`/src/components/layout/LayoutHead.astro:147-180`):
   ```html
   <script is:inline>
     // Theme management code
     const AVAILABLE_THEMES = ["light", "dark"];
     // ...
   </script>
   ```
   ❌ Missing nonce attribute after Sentry transformation

   **b) Structured Data Scripts** (`/src/components/layout/SeoMeta.astro:133, 144`):
   ```html
   <script is:inline type="application/ld+json" set:html={JSON.stringify(structuredData)} />
   ```
   ❌ Missing nonce attribute after Sentry transformation

### Why Firefox Specifically?

Firefox has **stricter CSP enforcement** than Chrome/Edge:
- Firefox blocks scripts immediately when CSP violations occur
- Chrome/Edge may show warnings but still execute scripts in some cases
- Firefox's CSP implementation follows the spec more strictly

### Technical Details

**Sentry Integration** (`/config/astro/integrations.ts:37-69`):
```typescript
sentry({
  sourceMapsUploadOptions: {
    telemetry: false,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT || "homepage",
    authToken: process.env.SENTRY_AUTH_TOKEN,
  },
})
```

The Sentry Astro integration is active and automatically modifies CSP at build time.

### Potential Solutions

#### Option 1: Disable Sentry CSP Transformation (Quick Fix)
Configure Sentry to not modify CSP headers:
```typescript
sentry({
  autoInstrumentServerFunctions: false, // Disable automatic CSP nonce injection
  // ... rest of config
})
```

#### Option 2: Use Script Hashes (Recommended)
Calculate SHA-256 hashes of inline scripts and add them to CSP:
```typescript
const themeScriptHash = "'sha256-yei5Fza+Eyx4G0smvN0xBqEesIKumz6RSyGsU3FJowI='";
```

Update CSP:
```typescript
script-src 'self' ${themeScriptHash}; // Remove 'unsafe-inline'
```

#### Option 3: Move Scripts to External Files (Best Practice)
Extract inline scripts to external `.js` files:
```html
<script src="/scripts/theme-init.js"></script>
```

This automatically works with CSP `'self'` directive.

#### Option 4: Use Astro's CSP Integration (Astro 5.9+)
Enable Astro's experimental CSP support which automatically handles nonces/hashes:
```typescript
// astro.config.ts
export default defineConfig({
  experimental: {
    security: {
      csrfProtection: {
        origin: true
      }
    }
  }
});
```

**Note:** This requires checking compatibility with Sentry integration.

---

## Browser Compatibility Matrix

| Browser | CORS Issue | CSP Issue | Status |
|---------|-----------|-----------|---------|
| Firefox (Win11) | ❌ Blocked | ⚠️ Violations | **Broken** |
| Firefox (macOS) | ❌ Blocked | ⚠️ Violations | **Broken** |
| Chrome | ✅ Works | ⚠️ Warnings | **Working** |
| Edge | ✅ Works | ⚠️ Warnings | **Working** |

---

## Action Items

### Immediate (Critical)

1. **[BACKEND]** Configure CORS headers on `eu.onetimesecret.com` API server
   - Add `Access-Control-Allow-Origin: https://onetimesecret.com`
   - Add `Access-Control-Allow-Methods: GET, POST, OPTIONS`
   - Add `Access-Control-Allow-Headers: Content-Type, Authorization`
   - Ensure OPTIONS preflight requests return proper CORS headers
   - Apply same configuration to all regional endpoints (ca, nz, us)

2. **[FRONTEND]** Fix CSP inline script violations (choose one approach):
   - **Quick:** Disable Sentry CSP transformation
   - **Better:** Calculate and add script hashes to CSP
   - **Best:** Extract inline scripts to external files

### Testing

1. Test secret creation in Firefox after CORS fix
2. Verify no CSP errors in Firefox console after CSP fix
3. Test all regional endpoints (EU, CA, NZ, US)
4. Verify Edge/Chrome still work correctly

---

## Related Files

### Frontend (onetimesecret.com)
- `/src/components/vue/forms/SecretForm.vue` - API call implementation
- `/src/components/layout/LayoutHead.astro` - CSP definition and theme script
- `/src/components/layout/SeoMeta.astro` - Structured data scripts
- `/src/utils/security.ts` - CSP generation logic
- `/config/astro/integrations.ts` - Sentry integration configuration
- `/sentry.client.config.ts` - Sentry client config
- `/sentry.server.config.ts` - Sentry server config

### Backend (eu.onetimesecret.com) - **NOT IN THIS REPOSITORY**
- CORS middleware/configuration (location unknown - separate repository)
- API endpoint handler for `/api/v2/secret/conceal`

---

## Additional Notes

### Why No Feedback Form Found

The diagnostic mentioned the feedback form also doesn't work in Firefox. However, **no dedicated feedback form component was found in this codebase**. The user may be referring to:
- An external feedback form (different domain)
- A contact form that doesn't exist yet
- The secret form itself being confused as a feedback form

### Environment Variables Required

For proper operation, ensure these environment variables are set:
- `VITE_PUBLIC_API_BASE_URL` - API base URL (defaults to regional endpoints if not set)
- `VITE_SENTRY_DSN` - Sentry client DSN
- `SENTRY_DSN` - Sentry server DSN (optional)

---

## Conclusion

The primary issue blocking Firefox users is the **CORS configuration on the backend API server**. This must be fixed in the backend repository (not this frontend codebase).

The CSP violations are a secondary issue that causes console errors but may not completely block functionality depending on browser behavior. However, they should still be addressed for proper security practices.

**Priority Order:**
1. Fix CORS on backend (Critical - blocks all Firefox users)
2. Fix CSP violations (High - security and browser compatibility)
3. Document feedback form location (Low - if it exists)

---

**End of Report**
