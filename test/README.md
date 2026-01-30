# Test Suite Documentation

This directory contains tests for the onetimesecret.com Astro/Vue site.

## Directory Structure

```
test/
|-- manual/              # Manual test procedures
|   |-- canonical-url-tests.md
|   |-- staging-banner-tests.md
|   |-- content-pages.md
|   |-- page-functional-tests.md
|
|-- unit/                # Unit tests (Vitest)
|   |-- vitest.config.ts
|   |-- utils/
|   |   |-- canonical-url.test.ts
|   |-- components/
|       |-- StagingBanner.test.ts
|
|-- e2e/                 # End-to-end tests (Playwright)
|   |-- playwright.config.ts
|   |-- specs/
|       |-- canonical-url.spec.ts
|       |-- staging-banner.spec.ts
|
|-- qase/                # Qase-compatible test cases
|   |-- canonical-url-test-cases.md
|   |-- staging-banner-test-cases.md
|
|-- schemas/             # JSON schema validation tests
    |-- run-schema-tests.sh
    |-- fixtures/
```

## Prerequisites

Install test dependencies (if not already installed):

```bash
# Unit tests (Vitest)
pnpm add -D vitest @vitejs/plugin-vue jsdom

# E2E tests (Playwright)
pnpm add -D @playwright/test
npx playwright install
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
pnpm vitest run --config test/unit/vitest.config.ts

# Run with watch mode
pnpm vitest --config test/unit/vitest.config.ts

# Run specific test file
pnpm vitest run test/unit/utils/canonical-url.test.ts

# Run with coverage
pnpm vitest run --config test/unit/vitest.config.ts --coverage
```

### E2E Tests (Playwright)

```bash
# Build the site first (required for preview server)
pnpm build

# Run all E2E tests
pnpm playwright test --config test/e2e/playwright.config.ts

# Run specific spec file
pnpm playwright test test/e2e/specs/canonical-url.spec.ts

# Run in headed mode (visible browser)
pnpm playwright test --headed

# Run specific project (browser)
pnpm playwright test --project=chromium

# Debug mode
pnpm playwright test --debug

# Generate HTML report
pnpm playwright show-report
```

### Test Against Staging

Some E2E tests require running against the actual staging domain:

```bash
BASE_URL=https://onetimesecret.dev pnpm playwright test --config test/e2e/playwright.config.ts
```

## Test Coverage

### Feature: Canonical URL Fix

| Test Type | Coverage |
|-----------|----------|
| Unit | URL generation, path handling, edge cases |
| E2E | HTML output verification |
| Manual | Cross-browser, social preview tools |

### Feature: Staging Banner

| Test Type | Coverage |
|-----------|----------|
| Unit | Hostname detection, localStorage, expiration |
| E2E | Visibility, dismiss, accessibility |
| Manual | Visual styling, dark mode, responsive |

## Writing New Tests

### Unit Tests

Use Vitest with Vue Test Utils for component testing:

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### E2E Tests

Use Playwright with Page Object pattern:

```typescript
import { test, expect } from '@playwright/test';

test('feature works', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});
```

### Manual Tests

Follow the format in existing manual test files:

```markdown
### TC-XX: Test Title

**Priority**: High/Medium/Low
**Category**: Functional/Visual/etc

**Steps**:
1. Do something
2. Do something else

**Expected Result**:
- What should happen
```

## Qase Integration

Test cases in `test/qase/` are formatted for import into Qase TMS.
Each test case includes:
- Unique ID
- Title
- Priority/Severity
- Automation status
- Steps and expected results

## CI/CD

Add to GitHub Actions:

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v2
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
    - run: pnpm install
    - run: pnpm build
    - run: pnpm vitest run --config test/unit/vitest.config.ts
    - run: pnpm playwright test --config test/e2e/playwright.config.ts
```

## Conventions

1. **File naming**: `*.test.ts` for unit tests, `*.spec.ts` for E2E tests
2. **Test data**: Use constants at top of file, avoid magic strings
3. **Selectors**: Prefer `data-testid` attributes for E2E tests
4. **Assertions**: Use specific assertions (`toBe`, `toContain`) over generic ones
5. **Cleanup**: Reset state in `beforeEach`/`afterEach` hooks
