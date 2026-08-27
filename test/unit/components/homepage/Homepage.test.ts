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

type JurisdictionStoreModule = typeof import('@/stores/jurisdictionStore');

/** The mounted host plus the store from the same module graph. */
interface MountedHomepage {
  el: HTMLElement;
  store: JurisdictionStoreModule;
  /** Resolves once Homepage's async `onMounted` body has finished. */
  settled: Promise<void>;
}

/**
 * Mounts Homepage.vue against a pristine module graph.
 *
 * Mounting does not wait for the async `onMounted` body, and `vi.waitFor`
 * cannot stand in for it whenever the expected end state is indistinguishable
 * from the initial render — the no-signal case asserts the store stayed on the
 * default, which is also what it holds before resolution runs at all. So the
 * region resolution is intercepted and its promise handed back, and the
 * no-signal test asserts it actually ran.
 */
async function mountHomepage(): Promise<MountedHomepage> {
  vi.resetModules();
  const [{ createApp }, { i18n }, store, homepage] = await Promise.all([
    import('vue'),
    import('@/i18n'),
    import('@/stores/jurisdictionStore'),
    import('@/components/vue/homepage/Homepage.vue'),
  ]);

  const initClientJurisdiction = store.initClientJurisdiction;
  let settle: () => void = () => {};
  const settled = new Promise<void>((resolve) => {
    // Resolve on the next macrotask, not immediately: resolution is awaited
    // partway through `onMounted`, and whatever follows it in that body runs
    // as microtasks that would otherwise land after the assertions.
    settle = () => setTimeout(resolve, 0);
  });

  vi.spyOn(store, 'initClientJurisdiction').mockImplementation(async () => {
    try {
      return await initClientJurisdiction();
    } finally {
      settle();
    }
  });

  host = document.createElement('div');
  document.body.appendChild(host);

  app = createApp(homepage.default, { locale: 'en', initialMessages: {} });
  app.use(i18n);
  app.mount(host);

  return { el: host, store, settled };
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

    const { el } = await mountHomepage();

    await vi.waitFor(() => {
      expect(selectedRegionLabel(el)).toContain('Canada');
    });
  });

  it('applies the geo signal when there is no stored choice', async () => {
    // Homepage runs the same resolution order as /pricing and the header.
    // It used to only *detect* — populating suggestion state without moving
    // the store — which left the hero form on the default region while the
    // header CTAs directly above it followed geo (PR #186 finding #2).
    setCountry('US');

    const { el } = await mountHomepage();

    await vi.waitFor(() => {
      expect(selectedRegionLabel(el)).toContain('United States');
    });
  });

  it('keeps the default region with no stored choice and no geo', async () => {
    // This used to pick a random active region so the page would not always
    // show EU. Auth links now follow the store, so a random pick would send
    // the same visitor to a different regional signup domain on every load.
    // Deterministic beats varied here: the default is what every other layer
    // resolves to with no signal.
    //
    // Awaiting `settled` is what gives this test teeth: every assertion below
    // is also true of the pre-mount state, so asserting without it would pass
    // just as happily against the random pick this replaced.
    const { el, store, settled } = await mountHomepage();
    await settled;

    expect(store.initClientJurisdiction).toHaveBeenCalled();
    expect(selectedRegionLabel(el)).toContain('European Union');
    expect(store.currentJurisdiction.get().identifier).toBe('EU');
    expect(store.hasExplicitJurisdiction()).toBe(false);
    expect(store.hasResolvedJurisdiction()).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
