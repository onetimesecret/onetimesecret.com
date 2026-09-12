// config/site.ts

import { loadEnv } from "vite";

// Explicit .ts extension: scripts/verify-sitemap.mjs imports this module under
// plain Node, whose type stripping does not resolve extensionless relative
// paths. Vite resolves it for the build.
import { CANONICAL_ORIGIN } from "./domains.ts";

/**
 * The vite mode to resolve .env files in.
 *
 * Both astro commands set NODE_ENV, verified by printing it at config-load
 * time: `astro dev` gives "development" and `astro build` gives "production".
 * So this only decides for a caller that is not an astro command, which means
 * scripts/verify-*.mjs running after a build — and there the build's own mode,
 * production, is the answer that keeps the gate validating what shipped.
 *
 * Exported so astro.config.ts resolves the same mode for its vite env. Two
 * loadEnv calls in one file defaulting differently is the shape #214 was about.
 */
export function resolveEnvMode(env: NodeJS.ProcessEnv = process.env): string {
  return env.NODE_ENV || "production";
}

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
 * astro.config.ts loads its own env for the vite config and now shares this
 * mode, so the two cannot default differently in the same file.
 *
 * Falls back to the canonical production origin because @astrojs/sitemap
 * silently skips generating a sitemap when `site` is unset (#214).
 */
export function resolveSite(env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()): string {
  if (env.VITE_BASE_URL) return env.VITE_BASE_URL;

  return envFiles(env, cwd).VITE_BASE_URL || CANONICAL_ORIGIN;
}

/**
 * What the .env files under `cwd` say, read as `env` rather than as the
 * ambient environment.
 *
 * vite's loadEnv merges process.env over the file values, and with an empty
 * prefix that means every variable. A caller passing an explicit `env` is
 * asking what that environment resolves to, so an ambient VITE_BASE_URL
 * leaking in would make the parameter a half-truth: resolveSite({}, dir)
 * would answer with a value the caller deliberately withheld, and any test of
 * the CANONICAL_ORIGIN fallback would pass or fail on whether the developer
 * running it happens to export VITE_BASE_URL. The exported-variable case is
 * already answered above, so the files are all that is wanted here.
 *
 * process.env is swapped rather than filtered because loadEnv reads it directly
 * and takes no environment argument. The swap is global while it is in place,
 * so this is only safe because loadEnv is synchronous: nothing else runs
 * between the assignment and the finally. If it ever becomes async, or this is
 * called from more than one thread, the swap has to go rather than be widened.
 *
 * A copy is passed so that anything loadEnv writes into process.env during
 * dotenv expansion lands on the copy instead of the caller's object. Vite does
 * not do that today (verified against the installed version), which is exactly
 * why it should not be depended on.
 */
function envFiles(env: NodeJS.ProcessEnv, cwd: string): Record<string, string> {
  const ambient = process.env;
  try {
    process.env = { ...env };
    return loadEnv(resolveEnvMode(env), cwd, "");
  } finally {
    process.env = ambient;
  }
}
