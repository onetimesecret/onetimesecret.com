/**
 * @file jurisdictionTestEnv.ts
 * @description Shared browser-environment fixtures for the jurisdiction suites
 * (store, composable, Pricing and Homepage components).
 *
 * Two things need faking in every one of them:
 *  - `window.__USER_COUNTRY__`, injected by the BunnyCDN edge middleware
 *  - `window.localStorage`, which jsdom under this Node version does not expose
 *    usably (Node's experimental accessor shadows jsdom's and resolves to
 *    undefined), so spying on `Storage.prototype` does not work here
 */

export { JURISDICTION_STORAGE_KEY } from '@/stores/jurisdictionStorage';

/** Sets or clears the country code the edge injects into the page. */
export function setCountry(code: string | undefined): void {
  const win = window as Window & { __USER_COUNTRY__?: string };
  if (code === undefined) {
    delete win.__USER_COUNTRY__;
  } else {
    win.__USER_COUNTRY__ = code;
  }
}

/** Builds a working, in-memory Storage implementation. */
export function createStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (key: string) => entries.get(key) ?? null,
    key: (index: number) => [...entries.keys()][index] ?? null,
    removeItem: (key: string) => {
      entries.delete(key);
    },
    setItem: (key: string, value: string) => {
      entries.set(key, String(value));
    },
  };
}

/**
 * Replaces `window.localStorage`.
 * @param storage Pass `null` to remove storage entirely, exercising the
 *   "storage unavailable" path. Defaults to a fresh in-memory Storage.
 */
export function installStorage(storage: Storage | null = createStorage()): void {
  Object.defineProperty(window, 'localStorage', {
    value: storage ?? undefined,
    writable: true,
    configurable: true,
  });
}
