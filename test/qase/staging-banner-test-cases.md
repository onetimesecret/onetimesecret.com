# Staging Banner Component - Qase Test Cases

## Suite: UI-001 Staging Banner

The dismiss control was removed in commit 630ff03, so TC-UI-004 through TC-UI-010 and TC-UI-014
are retired; see **Retired Cases** at the end. Their IDs are not reused.

### TC-UI-001: Banner Visible on Staging

**Title**: Staging banner should be visible on onetimesecret.dev
**Priority**: High
**Severity**: Critical
**Type**: Functional
**Automation**: Automated
**Preconditions**: accessing staging domain

**Steps**:
1. Navigate to https://onetimesecret.dev/
2. Observe top of page

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

### TC-UI-015: Accessibility - Keyboard Navigation

**Title**: Banner should be fully keyboard accessible
**Priority**: Medium
**Severity**: Major
**Type**: Accessibility
**Automation**: Automated

**Steps**:
1. Tab through banner elements
2. Activate production link with Enter

**Expected Result**:
- The production link, the banner's only interactive element, is reachable via keyboard
- Enter follows the link
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
1. Load a staging page and watch the top of the document as it hydrates
2. Load the same page on production, where the banner does not render
3. Observe layout

**Expected Result**:
- No jarring layout shift (CLS): the wrapper reserves its space before the `client:only` island
  mounts, and collapses to zero height off staging

---

## Automation Coverage

The Playwright cases no longer skip: the spec serves the local preview build under
`https://onetimesecret.dev` via request interception, so the staging hostname branch runs in CI.

| Test Case | Vitest | Playwright | Manual |
|-----------|--------|------------|--------|
| TC-UI-001 | No | Yes | No |
| TC-UI-002 | Yes | Yes | No |
| TC-UI-003 | Yes | Yes | No |
| TC-UI-011 | Yes | Yes | No |
| TC-UI-012 | No | Yes | Yes |
| TC-UI-013 | No | Yes | Yes |
| TC-UI-015 | Yes | No | Yes |
| TC-UI-016 | No | Yes | Yes |
| TC-UI-017 | No | Yes | Yes |
| TC-UI-018 | No | No | Yes |
| TC-UI-019 | No | No | Yes |
| TC-UI-020 | No | No | Yes |

## Test Files

- Unit tests: `test/unit/components/StagingBanner.test.ts`
- E2E tests: `test/e2e/specs/staging-banner.spec.ts`
- Manual tests: `test/manual/staging-banner-tests.md`

## Component Requirements

The data-testid attributes the E2E spec selects on:

```vue
<!-- Wrapper always renders so it can reserve space before hydration -->
<div data-testid="staging-banner-wrapper">
  <div data-testid="staging-banner" role="alert" aria-live="polite">
    <a data-testid="staging-banner-production-link" href="https://onetimesecret.com">
      Go to onetimesecret.com
    </a>
  </div>
</div>
```

## i18n Keys Required

```json
{
  "banner.staging-warning": "You are viewing our official staging environment",
  "banner.staging-description": "Content here is for testing and may differ from production.",
  "banner.go-to-production": "Go to onetimesecret.com"
}
```

## Retired Cases

Removed with the dismiss control in commit 630ff03 ("Remove dismiss functionality from staging
banner"). The IDs stay retired so Qase history keeps pointing at the right thing:

- TC-UI-004 through TC-UI-007: the dismiss button and the persistence of its state
- TC-UI-008, TC-UI-009: the 7-day expiration window
- TC-UI-010: localStorage unavailable. The page-level version now runs automatically in
  `test/e2e/specs/storage-unavailable.spec.ts`
- TC-UI-014: accessibility of the dismiss button
