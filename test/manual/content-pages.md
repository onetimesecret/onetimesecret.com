# Content Pages Manual Test Cases

## Overview

This document outlines test cases for content pages with internationalization support. These tests verify proper content loading, language fallbacks, and notifications across different scenarios.

## Setup Prerequisites

1. Ensure the following test content files exist for testing:
   - `src/content/pages/test-en-only.md` (English only)
   - `src/content/pages/test-multilingual.md` (Default English)
   - `src/content/pages/es/test-multilingual.md` (Spanish version)
   - `src/content/pages/fr/test-multilingual.md` (French version)

2. Create corresponding page files:
   - `src/pages/[lang]/test-en-only.astro`
   - `src/pages/[lang]/test-multilingual.astro`

## Test Cases

### TC-01: English-only content in English locale

**Steps:**
1. Navigate to `/en/test-en-only`

**Expected:**
- Content displays correctly
- No fallback notice is shown
- Page title matches content from `test-en-only.md`

### TC-02: English-only content in non-English locale

**Steps:**
1. Navigate to `/es/test-en-only`

**Expected:**
- Content displays in English
- Fallback notice is shown
- Notice text indicates viewing English content

### TC-03: Multilingual content in English locale

**Steps:**
1. Navigate to `/en/test-multilingual`

**Expected:**
- English content displays
- No fallback notice is shown

### TC-04: Multilingual content in supported non-English locale

**Steps:**
1. Navigate to `/es/test-multilingual`

**Expected:**
- Spanish content displays
- No fallback notice is shown

### TC-05: Multilingual content in unsupported locale

**Steps:**
1. Navigate to `/de/test-multilingual` (assuming German is supported but content doesn't exist)

**Expected:**
- English content displays
- Fallback notice is shown

### TC-06: Non-existent content

**Steps:**
1. Navigate to `/en/non-existent-page`

**Expected:**
- Appropriate error page or 404 is shown

### TC-07: Dismissable notice

**Steps:**
1. Navigate to `/es/test-en-only`
2. Verify fallback notice appears
3. Add `dismissable={true}` to the `LanguageFallbackNotice` component
4. Reload the page and click the dismiss button

**Expected:**
- Notice includes a dismiss button
- Notice disappears when dismissed

### TC-08: Different notice positions

**Steps:**
1. Navigate to `/es/test-en-only`
2. Modify position prop: `position="relative"`

**Expected:**
- Notice appears in the flow of the document instead of fixed to bottom right

## Regression Tests

### RT-01: Verify English-only pages don't show fallbacks in English

**Steps:**
1. Ensure `terms.md` exists only in the root directory (no language-specific versions)
2. Navigate to `/en/terms`

**Expected:**
- Content displays correctly
- No fallback notice is shown

### RT-02: Verify English-only pages show fallbacks in other languages

**Steps:**
1. Navigate to `/es/terms`

**Expected:**
- Content displays in English
- Fallback notice is shown correctly
