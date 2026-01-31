# Staging Banner Component - Test Cases

## Overview

This document contains test cases for the `StagingBanner.vue` component. This banner:
- Only appears on the staging domain (`onetimesecret.dev`)
- Uses amber/warning styling to indicate non-production environment
- Can be dismissed by users with 7-day localStorage expiration
- Provides a link to the production site

## Component Location

`src/components/vue/banners/StagingBanner.vue`

## Prerequisites

- Access to staging environment (`onetimesecret.dev`)
- Access to production environment (`onetimesecret.com`)
- Browser developer tools for localStorage inspection
- Ability to clear localStorage

## Test Cases

### TC-SB-01: Banner Visible on Staging Domain

**Priority**: High
**Category**: Visibility

**Steps**:
1. Clear localStorage (DevTools > Application > Storage > Clear site data)
2. Navigate to `https://onetimesecret.dev/`
3. Observe the top of the page

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

### TC-SB-07: Dismiss Button Functionality

**Priority**: High
**Category**: Interaction

**Steps**:
1. Clear localStorage
2. Navigate to `https://onetimesecret.dev/`
3. Click the dismiss/close button on the banner
4. Observe the page

**Expected Result**:
- Banner is hidden immediately after clicking dismiss
- Page layout adjusts smoothly (no jarring movement)
- No console errors

---

### TC-SB-08: Dismiss State Persists in localStorage

**Priority**: High
**Category**: State Persistence

**Steps**:
1. Clear localStorage
2. Navigate to `https://onetimesecret.dev/`
3. Dismiss the banner
4. Open DevTools > Application > Storage > Local Storage
5. Inspect the stored value

**Expected Result**:
- localStorage contains a key for the banner dismiss state
- Key name should be descriptive (e.g., `stagingBannerDismissed`)
- Value should include a timestamp or expiration date

**Expected localStorage format**:
```javascript
{
  "stagingBannerDismissedAt": "2024-01-15T10:30:00.000Z"
}
// OR
{
  "stagingBannerDismissedUntil": "2024-01-22T10:30:00.000Z"
}
```

---

### TC-SB-09: Banner Remains Hidden After Page Refresh

**Priority**: High
**Category**: State Persistence

**Steps**:
1. Dismiss the staging banner
2. Refresh the page (F5 or browser refresh)
3. Observe the page

**Expected Result**:
- Banner remains hidden after refresh
- State is correctly read from localStorage

---

### TC-SB-10: Banner Remains Hidden Across Navigation

**Priority**: High
**Category**: State Persistence

**Steps**:
1. Dismiss the staging banner on homepage
2. Navigate to another page (e.g., `/about`)
3. Observe the page
4. Navigate to another page (e.g., `/pricing`)

**Expected Result**:
- Banner remains hidden on all pages
- Dismiss state persists across client-side navigation

---

### TC-SB-11: 7-Day Expiration - Banner Reappears

**Priority**: High
**Category**: State Expiration

**Steps**:
1. Dismiss the staging banner
2. Open DevTools > Application > Local Storage
3. Manually modify the timestamp to be 8 days in the past:
   ```javascript
   // Example modification
   const past = new Date();
   past.setDate(past.getDate() - 8);
   localStorage.setItem('stagingBannerDismissedAt', past.toISOString());
   ```
4. Refresh the page

**Expected Result**:
- Banner reappears after the 7-day expiration period
- Old dismiss state is cleared or ignored
- User can dismiss again for another 7 days

---

### TC-SB-12: 7-Day Expiration - Banner Still Hidden Within Period

**Priority**: Medium
**Category**: State Expiration

**Steps**:
1. Dismiss the staging banner
2. Modify localStorage timestamp to be 6 days in the past
3. Refresh the page

**Expected Result**:
- Banner remains hidden (within 7-day window)
- State is still valid

---

### TC-SB-13: localStorage Unavailable - Graceful Degradation

**Priority**: Medium
**Category**: Error Handling

**Steps**:
1. Block localStorage access (or use incognito mode with strict settings)
2. Navigate to `https://onetimesecret.dev/`
3. Attempt to dismiss the banner
4. Refresh the page

**Expected Result**:
- Banner is visible initially
- Dismiss action works (banner hides)
- No console errors thrown
- Banner may reappear after refresh (expected behavior)
- Application does not crash

**Implementation Note**: Component should wrap localStorage calls in try-catch.

---

### TC-SB-14: localStorage Quota Exceeded

**Priority**: Low
**Category**: Error Handling

**Steps**:
1. Fill localStorage near quota limit
2. Navigate to staging and dismiss banner

**Expected Result**:
- Dismiss action completes without error
- If storage fails, banner hides for session only
- No user-facing error messages

---

### TC-SB-15: Accessibility - Dismiss Button

**Priority**: High
**Category**: Accessibility

**Steps**:
1. Navigate to `https://onetimesecret.dev/`
2. Inspect the dismiss button with accessibility tools
3. Use screen reader to navigate to the banner

**Expected Result**:
- Dismiss button has accessible label (aria-label or sr-only text)
- Button is keyboard focusable
- Focus state is visible
- Screen reader announces the button purpose (e.g., "Dismiss staging banner")

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
3. Use Enter/Space to activate buttons

**Expected Result**:
- Banner elements are reachable via keyboard
- Focus order is logical
- Dismiss button activates with Enter or Space
- Production link is accessible via keyboard

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

**Required i18n keys**:
```json
{
  "banner.staging.title": "Staging Environment",
  "banner.staging.message": "You are viewing the staging site. Data may differ from production.",
  "banner.staging.go-to-production": "Go to live site",
  "banner.staging.dismiss": "Dismiss"
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
   - Staging with banner dismissed
   - Production (no banner)
2. Check for layout shifts

**Expected Result**:
- Page content adjusts smoothly when banner is present/dismissed
- No cumulative layout shift (CLS) issues
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

### TC-SB-27: Rapid Dismiss/Show Toggle

**Steps**:
1. Dismiss banner
2. Quickly clear localStorage
3. Refresh before state can stabilize

**Expected Result**:
- No race conditions
- Component handles state transitions gracefully

---

### TC-SB-28: Multiple Browser Tabs

**Steps**:
1. Open staging site in two tabs
2. Dismiss banner in first tab
3. Switch to second tab and refresh

**Expected Result**:
- Dismiss state is shared across tabs (localStorage is shared)
- Both tabs show consistent state

---

## Performance

### TC-SB-29: No Performance Impact

**Steps**:
1. Use Lighthouse or DevTools Performance panel
2. Measure page load with banner visible

**Expected Result**:
- Banner does not significantly impact LCP
- No blocking resources for banner
- localStorage operations are synchronous but fast

---

## Completion Criteria

All high and medium priority test cases must pass before deployment. Low priority cases should be addressed in subsequent iterations.

## Related Files

- `src/components/vue/banners/StagingBanner.vue` - Main component
- `src/i18n/ui/*.json` - Translation files (add staging banner keys)
- `src/layouts/Layout.astro` - Where banner should be included
