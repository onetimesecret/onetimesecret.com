/**
 * @file theme.test.ts
 * @description ThemeManager must resolve a theme when storage is unreachable.
 *
 * A browser that denies site data (blocked cookies, enterprise policy, some
 * private modes) throws SecurityError from the `localStorage` property itself,
 * not just from getItem. Every read goes through readStoredTheme() for that
 * reason — including the one inside the prefers-color-scheme listener registered
 * by initialize(), where an exception would escape as an uncaught error in an
 * event handler with nothing above it to catch.
 *
 * On that path the resolved theme is the system preference, not a fixed "dark".
 * The inline anti-FOUC script in LayoutHead.astro resolves the same way, and the
 * two must agree: if they disagree the page paints one theme and flips to the
 * other once ThemeManager runs, which is the CLS the inline script exists to
 * prevent. test/e2e/specs/storage-unavailable.spec.ts gates that end to end.
 */

import { afterEach, describe, expect, it, vi, type MockInstance } from 'vitest';

// Statically imported for cleanup only; the cases under test load their own fresh
// copy of the module via freshThemeManager().
import { AVAILABLE_THEMES } from '@/utils/theme';

type SchemeListener = (event: { matches: boolean }) => void;

const ORIGINAL_STORAGE = Object.getOwnPropertyDescriptor(window, 'localStorage');
const ORIGINAL_MATCH_MEDIA = Object.getOwnPropertyDescriptor(window, 'matchMedia');

/** Loads a fresh copy of the module, so its warn-once flag starts unset. */
async function freshThemeManager() {
  vi.resetModules();
  const module = await import('@/utils/theme');
  return module.ThemeManager;
}

/** Makes the `localStorage` property throw, the way a denied browser does. */
function denyStorage(): void {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('localStorage is not available', 'SecurityError');
    },
  });
}

/**
 * Stubs matchMedia with a fixed preference; jsdom does not implement it.
 * Returns the listeners registered against it, so a change can be simulated.
 */
function stubColorScheme(prefersDark: boolean): SchemeListener[] {
  const listeners: SchemeListener[] = [];

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      media: query,
      matches: prefersDark,
      addEventListener: (_event: string, listener: SchemeListener) => {
        listeners.push(listener);
      },
      removeEventListener: () => {},
    }),
  });

  return listeners;
}

describe('ThemeManager', () => {
  afterEach(() => {
    if (ORIGINAL_STORAGE) {
      Object.defineProperty(window, 'localStorage', ORIGINAL_STORAGE);
      // In afterEach, not after each assertion: a failing expectation would skip
      // inline cleanup and leak a stored theme into the next case. Inside this
      // branch because the else below leaves no localStorage to clear, and a
      // TypeError thrown here would fail teardown for every later case.
      window.localStorage.clear();
    } else {
      Reflect.deleteProperty(window, 'localStorage');
    }
    if (ORIGINAL_MATCH_MEDIA) {
      Object.defineProperty(window, 'matchMedia', ORIGINAL_MATCH_MEDIA);
    } else {
      Reflect.deleteProperty(window, 'matchMedia');
    }
    document.documentElement.classList.remove(...AVAILABLE_THEMES);
    vi.restoreAllMocks();
  });

  it('returns the stored theme when storage is readable', async () => {
    stubColorScheme(true);
    window.localStorage.setItem('theme', 'light');
    const themeManager = await freshThemeManager();

    // An explicit choice wins over the system preference.
    expect(themeManager.getPreferredTheme()).toBe('light');
  });

  it('ignores a stored value that is not a known theme', async () => {
    stubColorScheme(true);
    window.localStorage.setItem('theme', 'sepia');
    const themeManager = await freshThemeManager();

    expect(themeManager.getPreferredTheme()).toBe('dark');
  });

  it.each([
    [true, 'dark'],
    [false, 'light'],
  ])(
    'resolves the system preference when storage is denied (prefersDark=%s)',
    async (prefersDark, expected) => {
      stubColorScheme(prefersDark as boolean);
      denyStorage();
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const themeManager = await freshThemeManager();

      // Must match the inline script in LayoutHead.astro, which also falls back
      // to the system preference rather than to a fixed theme.
      expect(themeManager.getPreferredTheme()).toBe(expected);
    }
  );

  it('reports unreachable storage once, however often it is read', async () => {
    stubColorScheme(false);
    denyStorage();
    const warn: MockInstance = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const themeManager = await freshThemeManager();

    // The colour-mode toggle re-reads on hover and focus, so an unbounded stream
    // of identical messages is the thing being prevented here.
    themeManager.getPreferredTheme();
    themeManager.getPreferredTheme();
    themeManager.readStoredTheme();

    expect(warn.mock.calls).toHaveLength(1);
  });

  it('survives a colour-scheme change with storage denied', async () => {
    const listeners = stubColorScheme(false);
    denyStorage();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const themeManager = await freshThemeManager();

    themeManager.initialize();
    expect(listeners).toHaveLength(1);

    // The listener re-reads the stored theme on every change. Unguarded, this
    // throws from inside an event handler.
    expect(() => listeners[0]({ matches: true })).not.toThrow();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
