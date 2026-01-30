# Staging Banner Component - Qase Test Cases

## Suite: UI-001 Staging Banner

### TC-UI-001: Banner Visible on Staging

**Title**: Staging banner should be visible on onetimesecret.dev
**Priority**: High
**Severity**: Critical
**Type**: Functional
**Automation**: Automated
**Preconditions**: localStorage cleared, accessing staging domain

**Steps**:
1. Clear browser localStorage
2. Navigate to https://onetimesecret.dev/
3. Observe top of page

**Expected Result**:
- Staging banner is visible
- Banner is prominently displayed

---

### TC-UI-002: Banner Hidden on Production

**Title**: Staging banner should NOT appear on production
**Priority**: High
**Severity**: Critical
**Type**: Functional
**Automation**: Automated

**Steps**:
1. Navigate to https://onetimesecret.com/
2. Observe page

**Expected Result**:
- No staging banner visible
- No placeholder or empty space

---

### TC-UI-003: Banner Hidden on Localhost

**Title**: Staging banner should NOT appear on localhost
**Priority**: Medium
**Severity**: Major
**Type**: Functional
**Automation**: Automated

**Steps**:
1. Start local dev server
2. Navigate to http://localhost:4321/
3. Observe page

**Expected Result**:
- No staging banner visible

---

### TC-UI-004: Dismiss Button Functionality

**Title**: Clicking dismiss should hide the banner
**Priority**: High
**Severity**: Critical
**Type**: Functional
**Automation**: Automated
**Preconditions**: Banner is visible

**Steps**:
1. Navigate to staging with cleared localStorage
2. Observe banner is visible
3. Click dismiss/close button

**Expected Result**:
- Banner hides immediately
- Page content adjusts smoothly
- No console errors

---

### TC-UI-005: Dismiss Persists to localStorage

**Title**: Dismiss state should be saved to localStorage
**Priority**: High
**Severity**: Critical
**Type**: Functional
**Automation**: Automated

**Steps**:
1. Dismiss the staging banner
2. Open DevTools > Application > Local Storage
3. Inspect stored values

**Expected Result**:
- Key `stagingBannerDismissedAt` exists
- Value is valid ISO 8601 timestamp

---

### TC-UI-006: Dismiss Persists After Refresh

**Title**: Banner should stay hidden after page refresh
**Priority**: High
**Severity**: Critical
**Type**: Functional
**Automation**: Automated

**Steps**:
1. Dismiss the banner
2. Refresh the page (F5)
3. Observe page

**Expected Result**:
- Banner remains hidden after refresh

---

### TC-UI-007: Dismiss Persists Across Navigation

**Title**: Banner should stay hidden when navigating
**Priority**: High
**Severity**: Major
**Type**: Functional
**Automation**: Automated

**Steps**:
1. Dismiss banner on homepage
2. Click link to another page (e.g., /about)
3. Observe page

**Expected Result**:
- Banner remains hidden on all pages

---

### TC-UI-008: 7-Day Expiration - Banner Returns

**Title**: Banner should reappear after 7 days
**Priority**: High
**Severity**: Critical
**Type**: Functional
**Automation**: Manual/Automated

**Steps**:
1. Dismiss banner
2. Modify localStorage timestamp to 8 days ago
3. Refresh page

**Expected Result**:
- Banner reappears
- User can dismiss again

---

### TC-UI-009: Within 7 Days - Banner Stays Hidden

**Title**: Banner should stay hidden within 7-day window
**Priority**: Medium
**Severity**: Major
**Type**: Functional
**Automation**: Automated

**Steps**:
1. Dismiss banner
2. Modify localStorage timestamp to 6 days ago
3. Refresh page

**Expected Result**:
- Banner remains hidden

---

### TC-UI-010: localStorage Unavailable

**Title**: Component should handle localStorage errors gracefully
**Priority**: Medium
**Severity**: Major
**Type**: Error Handling
**Automation**: Automated

**Steps**:
1. Block localStorage access (incognito mode or script)
2. Navigate to staging
3. Attempt to dismiss banner

**Expected Result**:
- No console errors thrown
- Banner hides for current session
- May reappear on refresh (expected)

---

### TC-UI-011: Production Link

**Title**: Banner should link to production site
**Priority**: High
**Severity**: Major
**Type**: Functional
**Automation**: Automated

**Steps**:
1. View banner on staging
2. Inspect production link

**Expected Result**:
- Link href is https://onetimesecret.com
- Link is functional

---

### TC-UI-012: Amber/Warning Styling - Light Mode

**Title**: Banner should use amber/warning colors in light mode
**Priority**: Medium
**Severity**: Minor
**Type**: Visual
**Automation**: Manual

**Steps**:
1. View banner in light mode
2. Inspect styling

**Expected Result**:
- Background: amber/yellow tones
- Text: dark amber/brown
- Clearly indicates warning/non-production

---

### TC-UI-013: Dark Mode Styling

**Title**: Banner should adapt correctly to dark mode
**Priority**: Medium
**Severity**: Minor
**Type**: Visual
**Automation**: Manual

**Steps**:
1. Enable dark mode
2. View banner

**Expected Result**:
- Colors adapt to dark mode
- Text remains readable
- Warning styling maintained

---

### TC-UI-014: Accessibility - Dismiss Button

**Title**: Dismiss button should have proper accessibility attributes
**Priority**: Medium
**Severity**: Major
**Type**: Accessibility
**Automation**: Automated

**Steps**:
1. Inspect dismiss button with accessibility tools
2. Check for aria-label
3. Test keyboard navigation

**Expected Result**:
- aria-label is present and descriptive
- Button is keyboard focusable
- Focus state is visible

---

### TC-UI-015: Accessibility - Keyboard Navigation

**Title**: Banner should be fully keyboard accessible
**Priority**: Medium
**Severity**: Major
**Type**: Accessibility
**Automation**: Automated

**Steps**:
1. Tab through banner elements
2. Activate dismiss with Enter/Space
3. Activate production link with Enter

**Expected Result**:
- All interactive elements reachable via keyboard
- Enter/Space activates buttons
- Logical tab order

---

### TC-UI-016: Screen Reader Announcement

**Title**: Banner content should be announced by screen readers
**Priority**: Medium
**Severity**: Major
**Type**: Accessibility
**Automation**: Manual

**Steps**:
1. Use screen reader on staging
2. Navigate to banner

**Expected Result**:
- Banner content is announced
- User understands they are on staging

---

### TC-UI-017: Responsive - Mobile

**Title**: Banner should display correctly on mobile
**Priority**: Medium
**Severity**: Minor
**Type**: Responsive
**Automation**: Automated

**Steps**:
1. View staging on mobile device/viewport
2. Inspect banner layout

**Expected Result**:
- Banner visible and readable
- No horizontal overflow
- Touch targets >= 44x44px

---

### TC-UI-018: i18n Support

**Title**: Banner text should be internationalized
**Priority**: Medium
**Severity**: Minor
**Type**: i18n
**Automation**: Manual

**Steps**:
1. Switch to French language
2. View banner text

**Expected Result**:
- Banner text is translated
- Production link URL unchanged

---

### TC-UI-019: Z-Index / Stacking

**Title**: Banner should have appropriate z-index
**Priority**: Low
**Severity**: Minor
**Type**: Visual
**Automation**: Manual

**Steps**:
1. View banner
2. Open dropdown menus
3. Scroll page

**Expected Result**:
- Banner doesn't incorrectly overlap modals
- Sticky behavior works (if implemented)

---

### TC-UI-020: No Layout Shift

**Title**: Banner should not cause layout shift
**Priority**: Medium
**Severity**: Minor
**Type**: Performance
**Automation**: Manual

**Steps**:
1. Load page with banner
2. Dismiss banner
3. Observe layout

**Expected Result**:
- Content adjusts smoothly
- No jarring layout shift (CLS)

---

## Automation Coverage

| Test Case | Vitest | Playwright | Manual |
|-----------|--------|------------|--------|
| TC-UI-001 | No | Yes (skip) | Yes |
| TC-UI-002 | Yes | Yes | No |
| TC-UI-003 | Yes | Yes | No |
| TC-UI-004 | Yes | Yes (skip) | Yes |
| TC-UI-005 | Yes | Yes (skip) | Yes |
| TC-UI-006 | Yes | Yes (skip) | Yes |
| TC-UI-007 | Yes | Yes (skip) | Yes |
| TC-UI-008 | Yes | Yes (skip) | Yes |
| TC-UI-009 | Yes | Yes (skip) | No |
| TC-UI-010 | Yes | Yes | No |
| TC-UI-011 | Yes | Yes (skip) | Yes |
| TC-UI-012 | No | No | Yes |
| TC-UI-013 | No | Yes (skip) | Yes |
| TC-UI-014 | Yes | Yes (skip) | Yes |
| TC-UI-015 | Yes | Yes (skip) | Yes |
| TC-UI-016 | No | No | Yes |
| TC-UI-017 | No | Yes (skip) | Yes |
| TC-UI-018 | No | No | Yes |
| TC-UI-019 | No | No | Yes |
| TC-UI-020 | No | No | Yes |

## Test Files

- Unit tests: `test/unit/components/StagingBanner.test.ts`
- E2E tests: `test/e2e/specs/staging-banner.spec.ts`
- Manual tests: `test/manual/staging-banner-tests.md`

## Component Requirements

The StagingBanner.vue component should include:

```vue
<!-- Required data-testid attributes for E2E testing -->
<div data-testid="staging-banner">
  <button data-testid="staging-banner-dismiss" aria-label="Dismiss staging banner">
    <!-- X icon -->
  </button>
  <a data-testid="staging-banner-production-link" href="https://onetimesecret.com">
    Go to live site
  </a>
</div>
```

## i18n Keys Required

```json
{
  "banner.staging.message": "You are viewing the staging environment",
  "banner.staging.go-to-production": "Go to live site",
  "banner.staging.dismiss": "Dismiss",
  "banner.staging.aria-dismiss": "Dismiss staging banner"
}
```
