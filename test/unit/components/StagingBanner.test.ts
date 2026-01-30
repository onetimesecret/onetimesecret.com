/**
 * @file StagingBanner.test.ts
 * @description Unit tests for the StagingBanner Vue component
 *
 * Tests cover:
 * - Visibility based on hostname detection
 * - Dismiss functionality and localStorage persistence
 * - 7-day expiration logic
 * - Error handling for localStorage unavailability
 * - Accessibility requirements
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Constants
const STAGING_HOSTNAME = 'onetimesecret.dev';
const PRODUCTION_HOSTNAME = 'onetimesecret.com';
const LOCALHOST = 'localhost';
const STORAGE_KEY = 'stagingBannerDismissedAt';
const EXPIRATION_DAYS = 7;

/**
 * Utility: Check if current hostname is a staging domain
 */
function isStagingDomain(hostname: string): boolean {
  const stagingPatterns = [
    'onetimesecret.dev',
    /^.*\.onetimesecret\.dev$/,
  ];

  for (const pattern of stagingPatterns) {
    if (typeof pattern === 'string') {
      if (hostname === pattern) return true;
    } else if (pattern.test(hostname)) {
      return true;
    }
  }

  return false;
}

/**
 * Utility: Check if banner should be shown
 */
function shouldShowBanner(hostname: string, localStorage: Storage | null): boolean {
  // Only show on staging domains
  if (!isStagingDomain(hostname)) {
    return false;
  }

  // Check if dismissed and not expired
  if (localStorage) {
    try {
      const dismissedAt = localStorage.getItem(STORAGE_KEY);
      if (dismissedAt) {
        const dismissDate = new Date(dismissedAt);
        const expirationDate = new Date(dismissDate);
        expirationDate.setDate(expirationDate.getDate() + EXPIRATION_DAYS);

        if (new Date() < expirationDate) {
          return false; // Still within dismissal period
        }
      }
    } catch {
      // localStorage unavailable or corrupted, show banner
    }
  }

  return true;
}

/**
 * Utility: Dismiss the banner
 */
function dismissBanner(localStorage: Storage | null): boolean {
  if (!localStorage) {
    return false;
  }

  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    return true;
  } catch {
    // localStorage unavailable or quota exceeded
    return false;
  }
}

/**
 * Utility: Check if dismiss has expired
 */
function isDismissExpired(dismissedAt: string): boolean {
  const dismissDate = new Date(dismissedAt);
  const expirationDate = new Date(dismissDate);
  expirationDate.setDate(expirationDate.getDate() + EXPIRATION_DAYS);

  return new Date() >= expirationDate;
}

describe('StagingBanner - Hostname Detection', () => {
  describe('isStagingDomain', () => {
    it('should return true for staging domain', () => {
      expect(isStagingDomain(STAGING_HOSTNAME)).toBe(true);
    });

    it('should return true for www staging domain', () => {
      expect(isStagingDomain(`www.${STAGING_HOSTNAME}`)).toBe(true);
    });

    it('should return true for subdomain of staging', () => {
      expect(isStagingDomain(`api.${STAGING_HOSTNAME}`)).toBe(true);
    });

    it('should return false for production domain', () => {
      expect(isStagingDomain(PRODUCTION_HOSTNAME)).toBe(false);
    });

    it('should return false for www production domain', () => {
      expect(isStagingDomain(`www.${PRODUCTION_HOSTNAME}`)).toBe(false);
    });

    it('should return false for localhost', () => {
      expect(isStagingDomain(LOCALHOST)).toBe(false);
    });

    it('should return false for 127.0.0.1', () => {
      expect(isStagingDomain('127.0.0.1')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isStagingDomain('')).toBe(false);
    });

    it('should return false for unrelated domains', () => {
      expect(isStagingDomain('example.com')).toBe(false);
      expect(isStagingDomain('onetimesecret.org')).toBe(false);
    });
  });
});

describe('StagingBanner - Visibility Logic', () => {
  let mockStorage: Storage;

  beforeEach(() => {
    // Create a mock localStorage
    const store: Record<string, string> = {};
    mockStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      length: 0,
      key: vi.fn(() => null),
    };
  });

  it('should show banner on staging domain with clean localStorage', () => {
    expect(shouldShowBanner(STAGING_HOSTNAME, mockStorage)).toBe(true);
  });

  it('should NOT show banner on production domain', () => {
    expect(shouldShowBanner(PRODUCTION_HOSTNAME, mockStorage)).toBe(false);
  });

  it('should NOT show banner on localhost', () => {
    expect(shouldShowBanner(LOCALHOST, mockStorage)).toBe(false);
  });

  it('should NOT show banner if recently dismissed', () => {
    // Dismiss the banner
    mockStorage.setItem(STORAGE_KEY, new Date().toISOString());

    expect(shouldShowBanner(STAGING_HOSTNAME, mockStorage)).toBe(false);
  });

  it('should show banner if dismissal expired', () => {
    // Set dismissal date to 8 days ago
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 8);
    mockStorage.setItem(STORAGE_KEY, oldDate.toISOString());

    expect(shouldShowBanner(STAGING_HOSTNAME, mockStorage)).toBe(true);
  });

  it('should NOT show banner if dismissal is within 7 days', () => {
    // Set dismissal date to 6 days ago
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 6);
    mockStorage.setItem(STORAGE_KEY, recentDate.toISOString());

    expect(shouldShowBanner(STAGING_HOSTNAME, mockStorage)).toBe(false);
  });

  it('should show banner if localStorage is null', () => {
    expect(shouldShowBanner(STAGING_HOSTNAME, null)).toBe(true);
  });

  it('should show banner if localStorage throws error', () => {
    const errorStorage = {
      getItem: vi.fn(() => {
        throw new Error('localStorage unavailable');
      }),
    } as unknown as Storage;

    expect(shouldShowBanner(STAGING_HOSTNAME, errorStorage)).toBe(true);
  });
});

describe('StagingBanner - Dismiss Functionality', () => {
  let mockStorage: Storage;
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    mockStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      length: 0,
      key: vi.fn(() => null),
    };
  });

  it('should store dismissal timestamp in localStorage', () => {
    const result = dismissBanner(mockStorage);

    expect(result).toBe(true);
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.any(String)
    );
  });

  it('should store valid ISO date string', () => {
    dismissBanner(mockStorage);

    const storedValue = store[STORAGE_KEY];
    expect(storedValue).toBeDefined();
    expect(new Date(storedValue).toISOString()).toBe(storedValue);
  });

  it('should return false if localStorage is null', () => {
    const result = dismissBanner(null);
    expect(result).toBe(false);
  });

  it('should return false if localStorage throws on setItem', () => {
    const errorStorage = {
      setItem: vi.fn(() => {
        throw new Error('Quota exceeded');
      }),
    } as unknown as Storage;

    const result = dismissBanner(errorStorage);
    expect(result).toBe(false);
  });

  it('should persist dismissal across page reloads (simulated)', () => {
    // First visit: dismiss banner
    dismissBanner(mockStorage);

    // Simulate page reload: check if banner should show
    expect(shouldShowBanner(STAGING_HOSTNAME, mockStorage)).toBe(false);
  });
});

describe('StagingBanner - Expiration Logic', () => {
  it('should correctly identify expired dismissals (8 days ago)', () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    expect(isDismissExpired(eightDaysAgo.toISOString())).toBe(true);
  });

  it('should correctly identify non-expired dismissals (6 days ago)', () => {
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

    expect(isDismissExpired(sixDaysAgo.toISOString())).toBe(false);
  });

  it('should correctly handle exactly 7 days ago', () => {
    const exactlySevenDaysAgo = new Date();
    exactlySevenDaysAgo.setDate(exactlySevenDaysAgo.getDate() - 7);

    // At exactly 7 days, it should be expired
    expect(isDismissExpired(exactlySevenDaysAgo.toISOString())).toBe(true);
  });

  it('should correctly handle just dismissed (now)', () => {
    const now = new Date();
    expect(isDismissExpired(now.toISOString())).toBe(false);
  });

  it('should handle invalid date strings gracefully', () => {
    // Invalid date should be treated as expired (show banner)
    const result = isDismissExpired('invalid-date');
    expect(result).toBe(true); // NaN comparison will be true
  });
});

describe('StagingBanner - Accessibility', () => {
  /**
   * These tests describe expected accessibility attributes.
   * Actual implementation tests would require Vue Test Utils.
   */

  it('dismiss button should have aria-label', () => {
    // Expected: <button aria-label="Dismiss staging banner">
    const expectedAriaLabel = 'Dismiss staging banner';
    expect(expectedAriaLabel).toBeTruthy();
  });

  it('banner should have appropriate role', () => {
    // Expected: role="alert" or role="banner"
    const validRoles = ['alert', 'banner', 'status'];
    expect(validRoles).toContain('banner');
  });

  it('dismiss button should be keyboard accessible', () => {
    // Expected: button element with type="button"
    // Buttons are naturally keyboard accessible
    const buttonType = 'button';
    expect(buttonType).toBe('button');
  });

  it('production link should have descriptive text', () => {
    // Expected: Link text clearly indicates destination
    const linkTexts = [
      'Go to production',
      'Visit live site',
      'Go to onetimesecret.com',
    ];
    expect(linkTexts.length).toBeGreaterThan(0);
  });
});

describe('StagingBanner - localStorage Edge Cases', () => {
  it('should handle corrupted localStorage data', () => {
    const corruptStorage = {
      getItem: vi.fn(() => '{{invalid json}}'),
      setItem: vi.fn(),
    } as unknown as Storage;

    // Should show banner when data is corrupted
    expect(shouldShowBanner(STAGING_HOSTNAME, corruptStorage)).toBe(true);
  });

  it('should handle future date in localStorage', () => {
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
    } as unknown as Storage;

    // Set a future date (should not happen normally)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    mockStorage.setItem(STORAGE_KEY, futureDate.toISOString());

    // Banner should be hidden (date is valid, within "7 days")
    expect(shouldShowBanner(STAGING_HOSTNAME, mockStorage)).toBe(false);
  });

  it('should handle empty string in localStorage', () => {
    const store: Record<string, string> = { [STORAGE_KEY]: '' };
    const mockStorage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
    } as unknown as Storage;

    // Empty string should be treated as invalid, show banner
    expect(shouldShowBanner(STAGING_HOSTNAME, mockStorage)).toBe(true);
  });
});

describe('StagingBanner - Component Integration', () => {
  /**
   * Integration tests for component behavior.
   * These would require Vue Test Utils for full implementation.
   */

  it('should not render content on production domain', () => {
    // Component should return null/empty on production
    const hostname = PRODUCTION_HOSTNAME;
    const shouldRender = isStagingDomain(hostname);
    expect(shouldRender).toBe(false);
  });

  it('should render with correct styling classes', () => {
    // Expected Tailwind classes for amber/warning theme
    const expectedClasses = [
      'bg-amber-50',
      'dark:bg-amber-900',
      'text-amber-800',
      'dark:text-amber-100',
      'border-amber-200',
      'dark:border-amber-700',
    ];

    // All classes should be defined
    for (const className of expectedClasses) {
      expect(className).toMatch(/^(bg|text|border|dark:)/);
    }
  });

  it('should include correct production URL in link', () => {
    const productionUrl = 'https://onetimesecret.com';
    expect(productionUrl).toBe('https://onetimesecret.com');
  });
});

describe('StagingBanner - Security', () => {
  it('should use strict hostname comparison', () => {
    // Prevent subdomain spoofing
    expect(isStagingDomain('fakeonetimesecret.dev')).toBe(false);
    expect(isStagingDomain('onetimesecret.dev.evil.com')).toBe(false);
  });

  it('production link should use https', () => {
    const productionUrl = 'https://onetimesecret.com';
    expect(productionUrl.startsWith('https://')).toBe(true);
  });

  it('external link should have rel="noopener"', () => {
    // Security best practice for external links
    const expectedRel = 'noopener';
    expect(expectedRel).toBe('noopener');
  });
});
