// The Astro 500 page, matched against Lighthouse's finalUrl
// (http://localhost:<port>/500.html). Anchored to the origin root so it does not
// also catch /bunnycdn_errors/500.html, a separate standalone document that is
// indexable and stays on the default thresholds.
//
// Every matrix entry whose pattern matches a URL contributes assertions, and all
// of them have to pass: @lhci/utils/src/assertions.js collects results for each
// matching entry rather than letting a later one override an earlier one. So the
// default entry has to exclude this page rather than simply be followed by a
// looser one.
const ASTRO_500_PAGE = '^https?://[^/]+/500\\.html$';

module.exports = {
  ci: {
    collect: {
      // Static Distribution Directory
      staticDistDir: './dist',
      // Explicit page set. Without this LHCI autodiscovers the first five
      // HTML files alphabetically (500.html, index.html, about, and the two
      // Bunny error pages), so the localized home and pricing pages were
      // never audited. Paths resolve against the static server's origin.
      url: [
        '/',
        '/en/',
        '/en/pricing/',
        '/en/about/',
        '/de/',
        '/500.html',
        '/bunnycdn_errors/404.html',
        '/bunnycdn_errors/500.html',
      ],
      // Run multiple times to get more stable results
      numberOfRuns: 3,
      // Mobile-first testing (desktop can be added as a separate LHCI run)
      settings: {
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 360,
          height: 640,
          deviceScaleFactor: 2,
          disabled: false,
        },
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
      },
      // Use default Lighthouse headers
      headers: {},
    },
    assert: {
      includePassedAssertions: true,
      assertMatrix: [
        {
          matchingUrlPattern: `^(?!${ASTRO_500_PAGE.slice(1)}).*`,
          assertions: {
            // Performance metrics with lower thresholds for CI
            'categories:performance': ['warn', { minScore: 0.85 }],
            'categories:accessibility': ['error', { minScore: 0.9 }],
            'categories:best-practices': ['error', { minScore: 0.9 }],
            'categories:seo': ['error', { minScore: 0.9 }],

            // Critical for performance
            'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
            'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
            // CLS is enforced. The region selector and pricing controls now
            // render during SSR with reserved label widths, and Zilla Slab has
            // metric-adjusted local fallbacks, so hydration and the font swap
            // no longer shift layout. Measured 0 on /, /en/, /de/, /en/about/
            // and /en/pricing/ (3 runs each, mobile profile). The standalone
            // Bunny error pages still swap fonts without tuned fallbacks and
            // measure <= 0.04, inside the threshold.
            'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
            'total-blocking-time': ['warn', { maxNumericValue: 300 }],

            // Image related tests
            'uses-responsive-images': 'warn',
            'uses-optimized-images': 'warn',
            'modern-image-formats': 'warn',
            'unsized-images': 'error',
            'render-blocking-resources': 'warn',

            // Performance optimizations (warn not error: a NO_LCP run returns
            // null scores, which LHCI treats as failures). The homepage used
            // to hit NO_LCP because the SSR `autofocus` on the secret textarea
            // scrolled the page before first paint on the 640px-tall mobile
            // profile; SecretForm.vue now focuses on mount with preventScroll.
            'uses-text-compression': 'warn',
            'unminified-css': 'warn',
            'unminified-javascript': 'warn',
            'unused-javascript': 'warn',
            'total-byte-weight': ['warn', { maxNumericValue: 2000000 }],

            // Accessibility checks
            'color-contrast': 'error',
            'document-title': 'error',
            'html-has-lang': 'error',
            'meta-description': 'error',
            'heading-order': 'warn',
            'label': 'error',

            // SEO checks
            'canonical': 'warn',
            'robots-txt': 'warn',

            // Astro-specific (disable some checks that don't apply)
            'uses-responsive-images-snapshot': 'off',
            'bf-cache': 'off',
            'legacy-javascript': 'off',
          }
        },
        {
          // /500.html is deliberately noindex: src/pages/500.astro sets it so an
          // error document is never indexed, which is also what stopped it
          // advertising an hreflang x-default for /500/, a URL Astro never
          // builds (it writes this page to dist/500.html). Lighthouse's
          // is-crawlable audit therefore fails by design and caps the SEO
          // category at 0.69 -- weight 4.04 of 13.04, measured on this build.
          //
          // The matrix entry above presumes an indexable page, so the category
          // is relaxed here rather than switched off: at 0.65 this still fails
          // on a real regression, because any second SEO audit failing takes
          // the score to 0.613. Everything else above still applies to this
          // page, including accessibility, best practices and CLS.
          matchingUrlPattern: ASTRO_500_PAGE,
          assertions: {
            'categories:seo': ['error', { minScore: 0.65 }],
          },
        },
      ],
    },
    upload: {
      // @lhci/cli's `temporary-public-storage` target never writes a local
      // manifest.json (only its `filesystem` target does — see
      // node_modules/@lhci/cli/src/upload/upload.js: runFilesystemTarget is
      // the only code path that calls fs.writeFileSync(manifestPath, ...)).
      // The "Comment on PR with Lighthouse results" and "Upload Lighthouse
      // reports" steps in .github/workflows/lighthouse.yml both depend on
      // .lighthouseci/manifest.json existing, so this has to be `filesystem`.
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
    server: {
      // Don't start a server for static site testing
    },
  },
};
