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
import { featureGroups, productTiers } from '@/data/product/productTiers';
import en from '@/i18n/ui/en.json';
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

/** Resolves a dotted i18n key against the English source, matching what the
 *  component's `t()` renders for the default locale. */
function tEn(key: string): string {
  const value = key
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], en);
  if (typeof value !== 'string') {
    throw new Error(`Missing or non-string i18n key: ${key}`);
  }
  return value;
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

describe('Pricing plan comparison', () => {
  it('renders one labelled table per feature group with a column per tier', async () => {
    const el = await mountPricing();

    const tables = [...el.querySelectorAll('table')];
    expect(tables).toHaveLength(featureGroups.length);

    tables.forEach((table, i) => {
      const heading = el.querySelector(`#${table.getAttribute('aria-labelledby')}`);
      expect(heading?.tagName).toBe('H4');
      expect(table.querySelectorAll('thead th[scope="col"]')).toHaveLength(productTiers.length);
      expect(table.querySelectorAll('tbody th[scope="row"]')).toHaveLength(
        featureGroups[i].features.length
      );
    });
  });

  it('marks every cell from the availableIn list of its feature', async () => {
    const el = await mountPricing();
    const tables = [...el.querySelectorAll('table')];

    featureGroups.forEach((group, gi) => {
      const rows = [...tables[gi].querySelectorAll('tbody tr')];
      group.features.forEach((feature, fi) => {
        // The icon is aria-hidden; the visually hidden span carries the state.
        const cells = [...rows[fi].querySelectorAll('td .sr-only')].map((span) =>
          span.textContent?.trim()
        );
        const expected = productTiers.map((tier) =>
          feature.availableIn.includes(tier.id) ? 'Included' : 'Not included'
        );
        expect(cells, feature.labelKey).toEqual(expected);
      });
    });
  });

  it('renders a status badge only for features that declare a statusKey', async () => {
    const el = await mountPricing();
    const tables = [...el.querySelectorAll('table')];

    // Guard: the assertion below is only meaningful while some feature carries
    // a status badge (e.g. Beta, Coming soon). If that ever stops being true,
    // this fails loudly rather than passing vacuously.
    const withStatus = featureGroups.flatMap((g) => g.features).filter((f) => f.statusKey);
    expect(withStatus.length).toBeGreaterThan(0);

    featureGroups.forEach((group, gi) => {
      const rows = [...tables[gi].querySelectorAll('tbody tr')];
      group.features.forEach((feature, fi) => {
        // The status pill is the only rounded-full element in the row header.
        const badge = rows[fi].querySelector('th[scope="row"] .rounded-full');
        if (feature.statusKey) {
          expect(badge, feature.labelKey).not.toBeNull();
          expect(badge?.textContent?.trim(), feature.labelKey).toBe(tEn(feature.statusKey));
        } else {
          expect(badge, feature.labelKey).toBeNull();
        }
      });
    });
  });
});
