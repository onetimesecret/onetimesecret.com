# Canonical URL Fix - Qase Test Cases

## Suite: SEO-001 Canonical URL Implementation

### TC-SEO-001: Canonical Link Uses Production Domain

**Title**: Canonical link tag should always use production domain
**Priority**: High
**Severity**: Critical
**Type**: Functional
**Automation**: Automated
**Preconditions**: Site is accessible on staging domain (onetimesecret.dev)

**Steps**:
1. Navigate to https://onetimesecret.dev/
2. Open browser developer tools
3. View page source
4. Locate `<link rel="canonical" ...>` tag in `<head>`

**Expected Result**:
- Canonical link exists
- href value is `https://onetimesecret.com/`
- Domain is NOT onetimesecret.dev

---

### TC-SEO-002: Canonical Preserves URL Path

**Title**: Canonical URL should preserve the full path
**Priority**: High
**Severity**: Critical
**Type**: Functional
**Automation**: Automated
**Preconditions**: Site is accessible

**Steps**:
1. Navigate to https://onetimesecret.dev/en/about
2. Inspect canonical link tag

**Expected Result**:
- Canonical: `https://onetimesecret.com/en/about`
- Path `/en/about` is preserved

**Test Data**:
| Input URL | Expected Canonical |
|-----------|-------------------|
| /en/about | https://onetimesecret.com/en/about |
| /fr/privacy | https://onetimesecret.com/fr/privacy |
| /pricing | https://onetimesecret.com/pricing |

---

### TC-SEO-003: Query Parameters in Canonical

**Title**: Canonical URL should handle query parameters
**Priority**: Medium
**Severity**: Major
**Type**: Functional
**Automation**: Automated

**Steps**:
1. Navigate to https://onetimesecret.dev/?ref=test&utm_source=email
2. Inspect canonical link tag

**Expected Result**:
- Query parameters are either preserved or intentionally stripped (per SEO policy)
- Domain is production

---

### TC-SEO-004: Open Graph URL Matches Canonical

**Title**: og:url meta tag should use production domain
**Priority**: High
**Severity**: Critical
**Type**: Functional
**Automation**: Automated

**Steps**:
1. Navigate to any page on staging
2. Locate `<meta property="og:url" ...>` tag

**Expected Result**:
- og:url uses production domain
- og:url matches canonical URL value

---

### TC-SEO-005: Hreflang Alternate Links

**Title**: All hreflang links should use production domain
**Priority**: High
**Severity**: Critical
**Type**: Functional
**Automation**: Automated

**Steps**:
1. Navigate to https://onetimesecret.dev/en/about
2. Inspect all `<link rel="alternate" hreflang="...">` tags

**Expected Result**:
- Hreflang tags exist for: en, fr, de, es, x-default
- All use production domain
- Language prefixes are correct

---

### TC-SEO-006: X-Default Hreflang

**Title**: x-default hreflang should strip language prefix
**Priority**: Medium
**Severity**: Major
**Type**: Functional
**Automation**: Automated

**Steps**:
1. Navigate to /en/about
2. Locate x-default hreflang link

**Expected Result**:
- x-default href is https://onetimesecret.com/about
- No language prefix in x-default URL

---

### TC-SEO-007: Single Canonical Per Page

**Title**: Only one canonical link should exist per page
**Priority**: Medium
**Severity**: Major
**Type**: Regression
**Automation**: Automated

**Steps**:
1. Navigate to any page
2. Count all canonical link tags

**Expected Result**:
- Exactly 1 canonical link tag exists
- No duplicate or conflicting canonicals

---

### TC-SEO-008: Build Output Verification

**Title**: Built HTML files should have correct canonical URLs
**Priority**: High
**Severity**: Critical
**Type**: Build Verification
**Automation**: Automated

**Steps**:
1. Run `pnpm build`
2. Inspect dist/index.html
3. Inspect dist/en/about/index.html

**Expected Result**:
- All canonical URLs in built files use production domain
- No staging domain references

---

### TC-SEO-009: Hash Fragment Handling

**Title**: Canonical URL should strip hash fragments
**Priority**: Low
**Severity**: Minor
**Type**: Edge Case
**Automation**: Automated

**Steps**:
1. Navigate to /en/about#team
2. Inspect canonical link

**Expected Result**:
- Canonical does not include #team
- Canonical: https://onetimesecret.com/en/about

---

### TC-SEO-010: Production Self-Reference

**Title**: Production site should have self-referencing canonical
**Priority**: Medium
**Severity**: Major
**Type**: Functional
**Automation**: Automated

**Steps**:
1. Navigate to https://onetimesecret.com/en/about
2. Inspect canonical link

**Expected Result**:
- Canonical correctly self-references production URL
- No redirect or domain mismatch

---

## Automation Coverage

| Test Case | Vitest | Playwright | Manual |
|-----------|--------|------------|--------|
| TC-SEO-001 | Yes | Yes | No |
| TC-SEO-002 | Yes | Yes | No |
| TC-SEO-003 | Yes | Yes | No |
| TC-SEO-004 | Yes | Yes | No |
| TC-SEO-005 | Yes | Yes | No |
| TC-SEO-006 | Yes | Yes | No |
| TC-SEO-007 | No | Yes | No |
| TC-SEO-008 | No | No | Yes |
| TC-SEO-009 | Yes | Yes | No |
| TC-SEO-010 | No | Yes | No |

## Test Files

- Unit tests: `test/unit/utils/canonical-url.test.ts`
- E2E tests: `test/e2e/specs/canonical-url.spec.ts`
- Manual tests: `test/manual/canonical-url-tests.md`
