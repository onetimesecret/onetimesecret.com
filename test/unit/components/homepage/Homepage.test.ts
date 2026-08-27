/**
 * @file Homepage.test.ts
 * @description Pins the other half of the region wiring: a region chosen on
 * /pricing must survive the navigation to the homepage.
 *
 * Astro serves full page loads, so the store starts empty on every page. If
 * Homepage stops restoring the persisted choice, the region selector silently
 * reverts to the EU default — the exact regression this branch closes.
 *
 * Mounted with `createApp` rather than @vue/test-utils, which this repo does
 * not depend on.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { App } from 'vue';
import {
  JURISDICTION_STORAGE_KEY as STORAGE_KEY,
  installStorage,
  setCountry,
} from '../../helpers/jurisdictionTestEnv';

let app: App | null = null;
let host: HTMLElement | null = null;

/** Mounts Homepage.vue against a pristine module graph. */
async function mountHomepage(): Promise<HTMLElement> {
  vi.resetModules();
  const [{ createApp }, { i18n }, homepage] = await Promise.all([
    import('vue'),
    import('@/i18n'),
    import('@/components/vue/homepage/Homepage.vue'),
  ]);

  host = document.createElement('div');
  document.body.appendChild(host);

  app = createApp(homepage.default, { locale: 'en', initialMessages: {} });
  app.use(i18n);
  app.mount(host);

  return host;
}

/** Region shown in the hero's region selector pill. */
function selectedRegionLabel(el: HTMLElement): string {
  return el.querySelector('#region-selector')?.textContent?.trim() ?? '';
}

beforeEach(() => {
  installStorage();
  setCountry(undefined);
});

afterEach(() => {
  app?.unmount();
  app = null;
  host?.remove();
  host = null;
  vi.restoreAllMocks();
});

describe('Homepage region selection', () => {
  it('restores a region chosen on another page', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'CA');
    // Geo disagrees with the stored choice; the choice must still win.
    setCountry('US');

    const el = await mountHomepage();

    await vi.waitFor(() => {
      expect(selectedRegionLabel(el)).toContain('Canada');
    });
  });

  it('leaves the default in place when geo detection only suggests', async () => {
    // No stored choice: detection populates the suggestion banner state but
    // must not move the store, and the random fallback must stay skipped.
    setCountry('US');

    const el = await mountHomepage();

    await vi.waitFor(() => {
      expect(selectedRegionLabel(el)).toContain('European Union');
    });
  });
});
