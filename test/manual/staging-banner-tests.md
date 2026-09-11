# Staging Banner Component - Test Cases

## Overview

This document contains test cases for the `StagingBanner.vue` component. This banner:
- Only appears on the staging domain (`onetimesecret.dev`) and its subdomains
- Uses amber/warning styling to indicate non-production environment
- Provides a link to the production site
- Cannot be dismissed: the control, its localStorage state and its 7-day expiry were
  removed in commit 630ff03

Most of this is now automated. `test/e2e/specs/staging-banner.spec.ts` serves the local preview
build under `https://onetimesecret.dev` through Playwright's request interception, so the
hostname branch runs in a real browser; the cases below are the ones a person still has to look
at.

## Component Location

`src/components/vue/banners/StagingBanner.vue`

## Prerequisites

- Access to staging environment (`onetimesecret.dev`)
- Access to production environment (`onetimesecret.com`)

## Test Cases

### TC-SB-01: Banner Visible on Staging Domain

**Priority**: High
**Category**: Visibility

**Steps**:
1. Navigate to `https://onetimesecret.dev/`
2. Observe the top of the page

**Expected Result**:
- Staging banner is visible at the top of the page
- Banner appears above or as part of the main navigation area
- Banner is prominent and noticeable

---

### TC-SB-02: Banner Hidden on Production Domain

**Priority**: High
**Category**: Visibility

**Steps**:
1. Navigate to `https://onetimesecret.com/`
2. Observe the page

**Expected Result**:
- Staging banner is NOT visible
- No visual indication of staging environment
- No placeholder or empty space where banner would be

---

### TC-SB-03: Banner Hidden on Localhost

**Priority**: Medium
**Category**: Visibility

**Steps**:
1. Run local development server (`pnpm dev`)
2. Navigate to `http://localhost:4321/` (or configured port)
3. Observe the page

**Expected Result**:
- Banner is NOT visible on localhost
- Development environment should NOT show staging banner

---

### TC-SB-04: Banner Styling - Amber/Warning Theme

**Priority**: Medium
**Category**: Visual

**Steps**:
1. Navigate to `https://onetimesecret.dev/`
2. Inspect the banner styling

**Expected Result**:
- Background color uses amber/yellow/warning tones
- Text is readable against the background
- Styling clearly indicates "warning" or "non-production"
- Colors follow the design system (Tailwind amber color palette)

**Visual Verification**:
- Background: amber-50/amber-100 (light mode) or amber-800/amber-900 (dark mode)
- Text: amber-800/amber-900 (light mode) or amber-100/amber-200 (dark mode)
- Border: amber-200/amber-300 (light mode) or amber-700 (dark mode)

---

### TC-SB-05: Dark Mode Styling

**Priority**: Medium
**Category**: Visual

**Steps**:
1. Navigate to `https://onetimesecret.dev/`
2. Toggle dark mode using the theme switcher
3. Observe the banner appearance

**Expected Result**:
- Banner adapts to dark mode color scheme
- Text remains readable
- Warning styling is maintained
- Contrast is sufficient for accessibility

---

### TC-SB-06: Banner Contains Production Link

**Priority**: High
**Category**: Content

**Steps**:
1. Navigate to `https://onetimesecret.dev/`
2. Inspect the banner content

**Expected Result**:
- Banner contains a link to `https://onetimesecret.com`
- Link text is clear (e.g., "Go to production", "Visit live site")
- Link opens correctly (verify target attribute if applicable)

---

### TC-SB-16: Accessibility - Production Link

**Priority**: Medium
**Category**: Accessibility

**Steps**:
1. Inspect the production link
2. Verify accessibility attributes

**Expected Result**:
- Link has descriptive text
- If link opens in new tab, indicate with `target="_blank"` and proper aria-label
- Include `rel="noopener"` for security if external link

---

### TC-SB-17: Accessibility - Banner Announcement

**Priority**: Medium
**Category**: Accessibility

**Steps**:
1. Use screen reader on staging site
2. Navigate through the page

**Expected Result**:
- Banner content is announced by screen reader
- Banner is marked appropriately (e.g., role="alert" or role="banner")
- User understands they are on staging environment

---

### TC-SB-18: Keyboard Navigation

**Priority**: Medium
**Category**: Accessibility

**Steps**:
1. Navigate to staging site
2. Use Tab key to navigate through the banner

**Expected Result**:
- Banner elements are reachable via keyboard
- Focus order is logical
- The production link takes focus and shows a visible focus ring
- Enter follows the production link

---

### TC-SB-19: Banner Message Content

**Priority**: Medium
**Category**: Content

**Steps**:
1. Review the banner text content

**Expected Result**:
- Message clearly indicates staging environment
- Message suggests visiting production for live data
- Text is concise and actionable

**Suggested content**:
- "You are viewing the staging environment."
- "This is a preview site. Data may not be real."
- Include link: "Go to onetimesecret.com for the live site."

---

### TC-SB-20: Internationalization (i18n)

**Priority**: Medium
**Category**: i18n

**Steps**:
1. Navigate to staging site
2. Change language using language switcher
3. Observe banner text

**Expected Result**:
- Banner text is translated
- Production link remains correct regardless of language
- All banner strings use i18n keys (not hardcoded)

**i18n keys the component uses** (`src/i18n/ui/*.json`):
```json
{
  "banner.staging-warning": "You are viewing our official staging environment",
  "banner.staging-description": "Content here is for testing and may differ from production.",
  "banner.go-to-production": "Go to onetimesecret.com"
}
```

---

### TC-SB-21: Responsive Design - Mobile

**Priority**: Medium
**Category**: Responsive

**Steps**:
1. Navigate to staging site on mobile device or responsive mode
2. Observe banner layout

**Expected Result**:
- Banner is visible and readable on mobile
- Text wraps appropriately
- Buttons/links are touch-friendly (min 44x44px tap targets)
- No horizontal overflow

---

### TC-SB-22: Responsive Design - Tablet

**Priority**: Low
**Category**: Responsive

**Steps**:
1. Navigate to staging site at tablet viewport width
2. Observe banner layout

**Expected Result**:
- Layout adapts appropriately
- Elements are well-spaced

---

### TC-SB-23: Banner Z-Index / Stacking

**Priority**: Medium
**Category**: Visual

**Steps**:
1. Navigate to staging site
2. Scroll down the page
3. Open any dropdown menus or modals
4. Check if banner overlaps with other elements

**Expected Result**:
- Banner has appropriate z-index
- Sticky/fixed banner stays visible on scroll
- Does not incorrectly overlap modals or dropdowns

---

### TC-SB-24: Banner Does Not Affect Page Layout

**Priority**: Medium
**Category**: Layout

**Steps**:
1. Compare page layout between:
   - Staging with banner visible
   - Production (no banner)
2. Check for layout shifts

**Expected Result**:
- No cumulative layout shift (CLS) issues: the wrapper reserves its space before the
  `client:only` island mounts and collapses to zero height off staging
- Header/navigation remains correctly positioned

---

### TC-SB-25: Hostname Detection Logic

**Priority**: High
**Category**: Logic

**Steps**:
1. Test the component with various hostnames:
   - `onetimesecret.dev` - should show banner
   - `www.onetimesecret.dev` - should show banner
   - `staging.onetimesecret.dev` - verify behavior
   - `onetimesecret.com` - should NOT show banner
   - `www.onetimesecret.com` - should NOT show banner
   - `localhost` - should NOT show banner
   - `127.0.0.1` - should NOT show banner

**Expected Result**:
- Banner logic correctly identifies staging domains
- Production and localhost are excluded

---

### TC-SB-26: Component Does Not Render on Server (SSR Safety)

**Priority**: Medium
**Category**: Technical

**Steps**:
1. Build the site (`pnpm build`)
2. Check the built HTML for any banner-related content
3. Verify component uses client-side hydration

**Expected Result**:
- Banner component should not cause SSR errors
- Hostname detection only runs on client
- Component properly handles server vs client rendering

---

## Edge Cases

## Performance

### TC-SB-29: No Performance Impact

**Steps**:
1. Use Lighthouse or DevTools Performance panel
2. Measure page load with banner visible

**Expected Result**:
- Banner does not significantly impact LCP
- No blocking resources for banner

---

## Retired Cases

The dismiss control was removed in commit 630ff03 ("Remove dismiss functionality from staging
banner"), along with its localStorage state and 7-day expiry. The cases that covered it are
retired rather than renumbered, so these IDs are not reused:

- TC-SB-07 through TC-SB-10: the dismiss button and the persistence of its state
- TC-SB-11, TC-SB-12: the 7-day expiration window
- TC-SB-13, TC-SB-14: localStorage unavailable and over quota. The page-level version of both now
  runs automatically in `test/e2e/specs/storage-unavailable.spec.ts`
- TC-SB-15: the accessible label on the dismiss button
- TC-SB-27, TC-SB-28: rapid dismiss toggling, and dismiss state shared between tabs

## Completion Criteria

All high and medium priority test cases must pass before deployment. Low priority cases should be addressed in subsequent iterations.

## Related Files

- `src/components/vue/banners/StagingBanner.vue` - Main component
- `config/domains.ts` - `isStagingHostname()`, which decides whether the banner renders
- `src/i18n/ui/*.json` - Translation files (`banner.staging-*`, `banner.go-to-production`)
- `src/components/layout/LayoutBase.astro` - Where the banner is included (`client:only="vue"`)
- `test/e2e/specs/staging-banner.spec.ts` - Automated coverage
