# Content Pages Functional Test Cases

## Overview

This document outlines manual test procedures for verifying the functionality of content pages in Onetime Secret. These tests focus on page loading, titles, content display, and language fallback behavior.

## Prerequisites

- Local development environment running (`pnpm dev` or `pnpm dev:local`)
- Access to browser developer tools for inspecting page titles and meta tags

## Test Cases

### TC-01: Verify Terms Page

1. **Navigation**: Visit `/terms`
2. **Title Check**: Verify page title is "Terms of Service | Onetime Secret"
3. **Content Check**:
   - Confirm terms of service content loads correctly
   - Verify section headings match the expected structure
   - Check that links within the content work properly
4. **Responsive Layout**: Test page rendering on mobile, tablet, and desktop viewports

### TC-02: Verify Privacy Page

1. **Navigation**: Visit `/privacy`
2. **Title Check**: Verify page title is "Privacy Policy | Onetime Secret"
3. **Content Check**:
   - Confirm privacy policy content loads correctly
   - Verify section headings are properly formatted
   - Check that all links within content work properly
4. **Responsive Layout**: Test page rendering on mobile, tablet, and desktop viewports

### TC-03: Verify Security Page with Language Support

1. **English Version**:
   - Visit `/en/security`
   - Verify page title is "Security | Onetime Secret"
   - Confirm security content loads correctly
   - No language fallback notice should appear

2. **Non-English Version** (if translations exist):
   - Visit `/es/security` (or other supported language)
   - If translated content exists, verify it displays correctly
   - If no translation exists, verify English content is shown with fallback notice

3. **Responsive Layout**: Test page rendering on mobile, tablet, and desktop viewports

### TC-04: Verify About Page with Language Support

1. **English Version**:
   - Visit `/en/about`
   - Verify page title is "About | Onetime Secret"
   - Confirm about page content loads correctly
   - No language fallback notice should appear

2. **Non-English Version** (if translations exist):
   - Visit `/es/about` (or other supported language)
   - If translated content exists, verify it displays correctly
   - If no translation exists, verify English content is shown with fallback notice

3. **Responsive Layout**: Test page rendering on mobile, tablet, and desktop viewports

### TC-05: Error Handling

1. **Non-existent Page**:
   - Visit `/en/nonexistent-page`
   - Verify appropriate 404 error page is displayed

2. **Invalid Language**:
   - Visit `/xx/about` (where xx is not a supported language code)
   - Verify appropriate error handling

## Cross-Browser Testing

Perform basic tests in the following browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (if on macOS)
- Edge (if on Windows)

## Regression Testing

After making changes to any content page, verify that:
1. All other content pages still load correctly
2. No unexpected fallback notices appear
3. Page titles remain correct across all pages
4. Layout and styling is consistent across all pages

## Completion Criteria

All test cases should pass without issues. Any failures should be documented and addressed before changes are merged.
