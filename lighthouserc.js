module.exports = {
  ci: {
    collect: {
      // Static Distribution Directory
      staticDistDir: './dist',
      // Run multiple times to get more stable results
      numberOfRuns: 3,
      // Test both mobile and desktop
      settings: [
        {
          preset: 'mobile',
          formFactor: 'mobile',
          screenEmulation: {
            mobile: true,
            width: 360,
            height: 640,
            deviceScaleFactor: 2,
            disabled: false,
          },
          throttling: {
            // Applied to Lighthouse runs with throttling enabled
            rttMs: 150,
            throughputKbps: 1638.4,
            cpuSlowdownMultiplier: 4,
            requestLatencyMs: 0,
            downloadThroughputKbps: 0,
            uploadThroughputKbps: 0,
          },
        },
        {
          preset: 'desktop',
          formFactor: 'desktop',
          screenEmulation: {
            mobile: false,
            width: 1350,
            height: 940,
            deviceScaleFactor: 1,
            disabled: false,
          },
          throttling: {
            rttMs: 40,
            throughputKbps: 10240,
            cpuSlowdownMultiplier: 1,
          },
        },
      ],
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
            'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
            'total-blocking-time': ['warn', { maxNumericValue: 300 }],

            // Image related tests
            'uses-responsive-images': 'warn',
            'uses-optimized-images': 'warn',
            'modern-image-formats': 'warn',
            'unsized-images': 'error',
            'render-blocking-resources': 'warn',

            // Performance optimizations
            'uses-text-compression': 'error',
            'unminified-css': 'error',
            'unminified-javascript': 'error',
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
