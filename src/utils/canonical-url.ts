/**
 * Canonical URL utilities for SEO tags.
 *
 * Used by LayoutHead.astro (production) and canonical-url.test.ts (tests)
 * so that the canonical-URL logic has a single source of truth.
 */

/**
 * Generates a canonical URL by combining the production origin with
 * the sanitised path and query string of the current request.
 *
 * Security: consecutive slashes in the path are collapsed to prevent
 * protocol-relative URL injection (CWE-601).  A request path like
 * `//evil.com/attack` would otherwise resolve to `https://evil.com/attack`
 * when fed to the `URL` constructor.
 *
 * @param currentPath - The pathname portion of the current URL (already
 *   extracted from `Astro.url.pathname` in the typical call-site).
 * @param search - The search/query portion (e.g. `?plan=premium`).
 * @param origin - The canonical production origin.
 * @returns The fully-qualified canonical URL string.
 */
export function generateCanonicalUrl(
  currentPath: string,
  search: string,
  origin: string,
): string {
  const normalizedPath = currentPath.replace(/\/{2,}/g, '/');
  return new URL(normalizedPath + search, origin).href;
}
