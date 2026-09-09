// scripts/lib/preload-helper.mjs
//
// What Vite's module preload helper looks like when it is intact. Shared by
// scripts/verify-dist.mjs (checks dist/) and scripts/verify-live.mjs (checks
// what the CDN serves) so that when Vite changes the helper there is one
// place to update, not two that drift apart.

/** Marker Vite always emits in its preload helper chunk. */
export const PRELOAD_HELPER_MARKER = "vite:preloadError";

/**
 * The helper's URL resolution, intact. Matches both the readable and the
 * minified form (`new URL(dep, import.meta.url)`, `new URL(e,import.meta.url)`).
 * `import.meta` is syntax, not an identifier, so a minifier cannot rename it
 * away; if it is gone, the helper was lowered.
 */
export const PRELOAD_HELPER_RESOLVES_WITH_IMPORT_META = /new URL\([^()]*import\.meta\.url\)/;

/**
 * The stub esbuild emits for `import.meta` when the output target does not
 * support it. Any of these in shipped code means the bundle was lowered.
 */
export const IMPORT_META_STUB = /\bconst import_meta\s*=\s*\{\}|\bimport_meta\.(?:url|resolve)\b/;
