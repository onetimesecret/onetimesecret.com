/**
 * @file App.test.ts
 * @description setupVue must survive a browser that denies site data.
 *
 * Astro calls setupVue for every island, so an exception thrown while reading the
 * stored language preference stops all of them hydrating and leaves the page
 * rendered but inert. test/e2e/specs/storage-unavailable.spec.ts gates that in a
 * real browser; this is the fast version, which fails in milliseconds.
 */

import { afterEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type { App } from 'vue';

import setupVue from '@/App';

/** Descriptor for the environment's own localStorage, restored after each test. */
const ORIGINAL_STORAGE = Object.getOwnPropertyDescriptor(window, 'localStorage');

/** Minimal stand-in for the Vue app instance Astro passes in. */
function fakeApp(): { app: App; use: MockInstance } {
  const use = vi.fn();
  return { app: { use } as unknown as App, use };
}

describe('setupVue', () => {
  afterEach(() => {
    if (ORIGINAL_STORAGE) {
      Object.defineProperty(window, 'localStorage', ORIGINAL_STORAGE);
    } else {
      Reflect.deleteProperty(window, 'localStorage');
    }
    vi.restoreAllMocks();
  });

  it('installs i18n when storage is readable', () => {
    const { app, use } = fakeApp();

    expect(() => setupVue(app)).not.toThrow();
    expect(use).toHaveBeenCalledTimes(1);
  });

  it('installs i18n when reading localStorage throws', () => {
    // Blocked site data raises SecurityError from the property getter itself, so
    // even a `window.localStorage` truthiness check throws.
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('localStorage is not available', 'SecurityError');
      },
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { app, use } = fakeApp();

    expect(() => setupVue(app)).not.toThrow();
    expect(use).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      'Failed to read preferred language:',
      expect.any(DOMException)
    );
  });

  it('installs i18n when localStorage is absent', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: null,
    });
    const { app, use } = fakeApp();

    // `?.` short-circuits on null, so this path reads no key and warns about
    // nothing — it must still get as far as installing i18n.
    expect(() => setupVue(app)).not.toThrow();
    expect(use).toHaveBeenCalledTimes(1);
  });
});
