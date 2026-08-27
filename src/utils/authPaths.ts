// src/utils/authPaths.ts

/**
 * The auth entry points this site hands off to the regional app domains.
 *
 * Three layers decide whether a request or an anchor is an auth entry point —
 * the edge redirect (`edge/bunnycdn-auth-redirect.ts`), the client-side link
 * rewriter (`src/utils/regionalAuth.ts`) and the origin interstitial pages
 * (`src/pages/{signin,signup}.astro`). They must claim exactly the same paths,
 * so the list and the normalization live here rather than in each of them.
 *
 * Kept free of imports and side effects: the edge scripts bundle it, and they
 * run in a Deno-flavored runtime with no DOM and no app globals.
 */

/** Root-relative auth paths, already normalized. */
export const AUTH_PATHS = ["/signin", "/signup"] as const;

/**
 * Strip trailing slashes so `/signin/` matches `/signin`. An empty result
 * means the root path.
 */
export function normalizeAuthPath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

/** Whether a pathname is one of the auth entry points. */
export function isAuthPath(pathname: string): boolean {
  return (AUTH_PATHS as readonly string[]).includes(
    normalizeAuthPath(pathname),
  );
}
