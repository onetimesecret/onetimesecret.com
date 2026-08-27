/**
 * @file Pricing.test.ts
 * @description Pins the wiring the branch exists for: /pricing CTA links must
 * point at the region the client resolves, not the EU default.
 *
 * The store unit tests cover the resolution order itself; this suite mounts the
 * real component so that removing the `initJurisdiction()` call from its
 * `onMounted` hook fails a test instead of silently restoring the bug.
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

/**
 * Mounts Pricing.vue against a pristine module graph. The jurisdiction store is
 * a module singleton, so the component, its i18n instance and the store must
 * all come from the same freshly reset registry.
 */
async function mountPricing(): Promise<HTMLElement> {
  vi.resetModules();
  const [{ createApp }, { i18n }, pricing] = await Promise.all([
    import('vue'),
    import('@/i18n'),
    import('@/components/vue/pricing/Pricing.vue'),
  ]);

  host = document.createElement('div');
  document.body.appendChild(host);

  app = createApp(pricing.default, { locale: 'en' });
  app.use(i18n);
  app.mount(host);

  return host;
}

/** Hosts of the regional signup CTAs, one per pricing tier. */
function signupHosts(el: HTMLElement): string[] {
  return [...el.querySelectorAll<HTMLAnchorElement>('a[href]')]
    .map((anchor) => new URL(anchor.href))
    .filter((url) => url.pathname === '/signup')
    .map((url) => url.host);
}

/** Host of the "discounts" feedback CTA. */
function feedbackHost(el: HTMLElement): string | undefined {
  return [...el.querySelectorAll<HTMLAnchorElement>('a[href]')]
    .map((anchor) => new URL(anchor.href))
    .find((url) => url.pathname === '/feedback')?.host;
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

describe('Pricing CTA region', () => {
  it('seeds signup links from the edge-injected country', async () => {
    setCountry('US');

    const el = await mountPricing();

    await vi.waitFor(() => {
      const hosts = signupHosts(el);
      expect(hosts.length).toBeGreaterThan(0);
      expect([...new Set(hosts)]).toEqual(['us.onetimesecret.com']);
    });
    expect(feedbackHost(el)).toBe('us.onetimesecret.com');
  });

  it('prefers a persisted choice over the detected country', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'CA');
    setCountry('US');

    const el = await mountPricing();

    await vi.waitFor(() => {
      expect([...new Set(signupHosts(el))]).toEqual(['ca.onetimesecret.com']);
    });
  });

  it('falls back to the default region with no choice and no geo', async () => {
    const el = await mountPricing();

    await vi.waitFor(() => {
      const hosts = signupHosts(el);
      expect(hosts.length).toBeGreaterThan(0);
      expect([...new Set(hosts)]).toEqual(['eu.onetimesecret.com']);
    });
  });
});
