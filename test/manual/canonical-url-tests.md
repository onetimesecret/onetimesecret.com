# Canonical URL Fix - Test Cases

## Overview

This document contains test cases for verifying the canonical URL fix implementation. The fix ensures all canonical URLs, Open Graph URLs, and alternate language links point to the production domain (`https://onetimesecret.com`) regardless of which domain serves the content.

## Background

- Production domain: `https://onetimesecret.com`
- Staging domain: `https://onetimesecret.dev`
- Regional domains may also exist (e.g., `eu.onetimesecret.com`)

The canonical URL must always reference the production domain for SEO purposes, even when the page is accessed from staging or other domains.

## Prerequisites

- Access to staging environment (`onetimesecret.dev`)
- Access to production environment (`onetimesecret.com`)
- Browser developer tools for inspecting HTML source
- cURL or similar tool for raw HTTP response inspection

## Test Cases

### TC-CU-01: Canonical Link Tag Uses Production Domain

**Priority**: High
**Category**: SEO

**Steps**:
1. Navigate to `https://onetimesecret.dev/` (staging)
2. Open browser developer tools (View Source or Elements panel)
3. Locate the `<link rel="canonical" ...>` tag in the `<head>` section

**Expected Result**:
- The canonical link should be: `<link rel="canonical" href="https://onetimesecret.com/">`
- The href must NOT contain `onetimesecret.dev`

**Verification Query**:
```bash
curl -s https://onetimesecret.dev/ | grep 'rel="canonical"'
```

---

### TC-CU-02: Canonical URL Preserves Path

**Priority**: High
**Category**: SEO

**Steps**:
1. Navigate to `https://onetimesecret.dev/en/about`
2. View page source and locate the canonical link tag

**Expected Result**:
- Canonical: `<link rel="canonical" href="https://onetimesecret.com/en/about">`
- Path `/en/about` must be preserved
- Domain must be production

**Test Paths**:
| Staging URL | Expected Canonical |
|-------------|-------------------|
| `https://onetimesecret.dev/` | `https://onetimesecret.com/` |
| `https://onetimesecret.dev/en/about` | `https://onetimesecret.com/en/about` |
| `https://onetimesecret.dev/fr/privacy` | `https://onetimesecret.com/fr/privacy` |
| `https://onetimesecret.dev/pricing` | `https://onetimesecret.com/pricing` |

---

### TC-CU-03: Canonical URL Preserves Query Parameters

**Priority**: Medium
**Category**: SEO

**Steps**:
1. Navigate to `https://onetimesecret.dev/?ref=test&utm_source=docs`
2. View page source and locate the canonical link tag

**Expected Result**:
- Canonical should be: `https://onetimesecret.com/?ref=test&utm_source=docs`
- Query parameters should be preserved in canonical URL
- Domain must be production

**Note**: Depending on SEO strategy, query parameters may intentionally be stripped from canonical URLs. Verify intended behavior with product team.

---

### TC-CU-04: Open Graph URL Uses Production Domain

**Priority**: High
**Category**: SEO / Social Sharing

**Steps**:
1. Navigate to `https://onetimesecret.dev/en/about`
2. View page source and locate `<meta property="og:url" ...>`

**Expected Result**:
- `<meta property="og:url" content="https://onetimesecret.com/en/about">`
- Domain must be production
- Path must match the current page path

**Verification**:
```bash
curl -s https://onetimesecret.dev/en/about | grep 'og:url'
```

---

### TC-CU-05: Alternate Language Links Use Production Domain

**Priority**: High
**Category**: SEO / i18n

**Steps**:
1. Navigate to `https://onetimesecret.dev/en/about`
2. View page source and locate all `<link rel="alternate" hreflang="...">` tags

**Expected Result**:
All alternate language links should use the production domain:
```html
<link rel="alternate" hreflang="en" href="https://onetimesecret.com/en/about">
<link rel="alternate" hreflang="fr" href="https://onetimesecret.com/fr/about">
<link rel="alternate" hreflang="de" href="https://onetimesecret.com/de/about">
<link rel="alternate" hreflang="es" href="https://onetimesecret.com/es/about">
<link rel="alternate" hreflang="x-default" href="https://onetimesecret.com/about">
```

**Verification**:
```bash
curl -s https://onetimesecret.dev/en/about | grep 'hreflang'
```

---

### TC-CU-06: X-Default Hreflang Uses Production Domain

**Priority**: High
**Category**: SEO / i18n

**Steps**:
1. Navigate to any page on staging
2. Locate the `<link rel="alternate" hreflang="x-default" ...>` tag

**Expected Result**:
- `<link rel="alternate" hreflang="x-default" href="https://onetimesecret.com/...">`
- Must use production domain
- Path should be the base path without language prefix

---

### TC-CU-07: Production Domain Canonical Self-References

**Priority**: Medium
**Category**: SEO

**Steps**:
1. Navigate to `https://onetimesecret.com/en/about` (production)
2. View page source and verify canonical link

**Expected Result**:
- Canonical: `<link rel="canonical" href="https://onetimesecret.com/en/about">`
- Production pages should self-reference correctly

---

### TC-CU-08: Empty Path Handling (Root URL)

**Priority**: Medium
**Category**: Edge Case

**Steps**:
1. Navigate to `https://onetimesecret.dev/`
2. Check canonical link

**Expected Result**:
- Canonical: `<link rel="canonical" href="https://onetimesecret.com/">`
- Root path should be handled correctly (either `/` or empty string)

---

### TC-CU-09: Deep Nested Paths

**Priority**: Low
**Category**: Edge Case

**Steps**:
1. Test with various path depths:
   - `/en/about`
   - `/en/info/security`
   - `/secret/abc123` (if applicable)

**Expected Result**:
- All paths should be correctly appended to production domain
- No double slashes in URL
- No missing slashes

---

### TC-CU-10: Special Characters in Path

**Priority**: Low
**Category**: Edge Case

**Steps**:
1. Test with URL-encoded characters in path (if supported)
2. Verify encoding is preserved in canonical URL

**Expected Result**:
- Special characters should be properly URL-encoded
- No malformed URLs

---

### TC-CU-11: Hash Fragments in URL

**Priority**: Low
**Category**: Edge Case

**Steps**:
1. Navigate to `https://onetimesecret.dev/en/about#team`
2. Check canonical link

**Expected Result**:
- Hash fragments are typically NOT included in canonical URLs
- Expected: `<link rel="canonical" href="https://onetimesecret.com/en/about">`

---

### TC-CU-12: Trailing Slash Consistency

**Priority**: Medium
**Category**: Edge Case

**Steps**:
1. Compare canonical URLs for:
   - `https://onetimesecret.dev/about`
   - `https://onetimesecret.dev/about/`

**Expected Result**:
- Both should produce the same canonical URL
- Trailing slash handling should be consistent with site convention

---

## Build Output Verification

### TC-CU-13: Verify Production Build Output

**Priority**: High
**Category**: Build Verification

**Steps**:
1. Run `pnpm build` for production
2. Inspect built HTML files in `dist/` directory
3. Verify canonical URLs in HTML files

**Commands**:
```bash
# Build the site
pnpm build

# Check canonical in homepage
grep 'rel="canonical"' dist/index.html

# Check canonical in about page
grep 'rel="canonical"' dist/en/about/index.html

# Check og:url in pages
grep 'og:url' dist/en/about/index.html
```

**Expected Result**:
- All canonical URLs in built files should use production domain

---

## Regression Tests

### TC-CU-14: No Canonical Duplication

**Steps**:
1. View page source for any page
2. Search for all canonical link tags

**Expected Result**:
- Only ONE canonical link tag should exist per page
- No duplicate or conflicting canonical URLs

---

### TC-CU-15: Meta Tags Remain Functional

**Steps**:
1. Verify other meta tags are not affected by the canonical fix:
   - `<meta name="description">`
   - `<meta name="keywords">`
   - `<meta property="og:title">`
   - `<meta property="og:description">`
   - `<meta property="og:image">`

**Expected Result**:
- All other meta tags should remain functional
- Only canonical-related URLs should be modified

---

## Social Media Preview Tools

### TC-CU-16: Social Preview Validation

**Steps**:
1. Use social media preview tools to validate:
   - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
   - Twitter Card Validator: https://cards-dev.twitter.com/validator
   - LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

**Expected Result**:
- og:url should show production domain
- Preview should work correctly
- No warnings about canonical mismatch

---

## Completion Criteria

All test cases should pass. Any failures indicate potential SEO issues that must be resolved before deployment.

## Related Files

- `src/components/layout/LayoutHead.astro` - Main head component
- `src/components/layout/SeoMeta.astro` - SEO meta tags component
- `src/utils/seo.ts` - SEO utility functions
