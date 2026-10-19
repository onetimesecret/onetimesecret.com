// scripts/lib/bunny-api.mjs
//
// The Bunny account API client and the .env loading shared by the scripts that
// talk to it: edge/error-page/cli.mjs (pull zone error pages) and
// scripts/lookalike-dns.mjs (DNS zones). One copy, so a fix to error handling
// or timeouts reaches both.

import { join } from "node:path";

export const API_BASE = "https://api.bunny.net";

/** Bunny answers within a few seconds; anything longer is a hung connection. */
export const REQUEST_TIMEOUT_MS = 30_000;

const ROOT_DIR = join(import.meta.dirname, "..", "..");

/**
 * Loads the repo-root .env.local and .env the way .envrc does for direnv
 * users, so both paths see the same variables. Node never overrides a variable
 * already in the environment, so loading .env.local first gives the same
 * precedence as direnv: environment > .env.local > .env. A missing file is the
 * normal case in CI and is silently fine.
 * @param {string} [rootDir] where the files live; the repo root by default
 */
export function loadDotenv(rootDir = ROOT_DIR) {
  for (const name of [".env.local", ".env"]) {
    try {
      process.loadEnvFile(join(rootDir, name));
    } catch (err) {
      if (err?.code !== "ENOENT") throw err;
    }
  }
}

/**
 * @typedef {object} Client
 * @property {string} apiKey
 * @property {typeof fetch} fetch
 */

/**
 * One API call. Throws on a non-2xx status with the start of the body, which
 * carries Bunny's error message and never the key. An empty body, 204 or
 * otherwise, is null.
 * @param {Client} client
 * @param {string} path
 * @param {{ method?: string, body?: unknown }} [init]
 */
export async function bunny(client, path, { method = "GET", body } = {}) {
  const res = await client.fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      AccessKey: client.apiKey,
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = (await res.text()).slice(0, 300);
    throw new Error(`${method} ${path} → HTTP ${res.status}${text ? `: ${text}` : ""}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
