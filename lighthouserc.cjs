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
          matchingUrlPattern: '.*',
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
      ],
    },
    upload: {
      target: 'temporary-public-storage',
      githubStatusContextSuffix: 'astro-lighthouse-ci',
      githubToken: process.env.GITHUB_TOKEN,
    },
    server: {
      // Don't start a server for static site testing
    },
  },
};
