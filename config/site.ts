// config/site.ts

import { loadEnv } from "vite";

// Explicit .ts extension: scripts/verify-sitemap.mjs imports this module under
// plain Node, whose type stripping does not resolve extensionless relative
// paths. Vite resolves it for the build.
import { CANONICAL_ORIGIN } from "./domains.ts";

/**
 * The origin the site is built for, used as Astro's `site` option.
 *
 * Single source of truth on purpose. astro.config.ts and the build gate in
 * scripts/verify-sitemap.mjs run in separate processes and both need this
 * answer; two copies agreeing only by prose is the shape of the bug #214 was
 * filed about.
 *
 * An exported variable wins over a .env file, which is vite's own precedence
 * and how CI and both deploy workflows pass VITE_BASE_URL. The mode defaults
 * to production because `astro build` sets NODE_ENV=production before loading
 * the config, so anything resolving this after a build must agree.
 *
 * Falls back to the canonical production origin because @astrojs/sitemap
 * silently skips generating a sitemap when `site` is unset (#214).
 */
export function resolveSite(env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()): string {
  if (env.VITE_BASE_URL) return env.VITE_BASE_URL;

  const loaded = loadEnv(env.NODE_ENV || "production", cwd, "");
  return loaded.VITE_BASE_URL || CANONICAL_ORIGIN;
}
