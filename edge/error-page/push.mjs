#!/usr/bin/env node
// edge/error-page/push.mjs
//
// Pushes edge/error-page/regional.html to the custom error page setting of
// every regional pull zone, so the five zones never drift from the file in
// git or from each other.
//
//   pnpm edge:error-page            # report drift, exit 1 if any zone differs
//   pnpm edge:error-page --apply    # push the file to every zone that differs
//   pnpm edge:error-page eu uk      # limit to some regions (either mode)
//
// Needs BUNNY_API_KEY (the account API key, same secret the deploy workflows
// use to purge). Zones are found by hostname, not by ID, so nothing here has
// to be updated when a zone is recreated.
//
// Bunny API surface used (verified against docs.bunny.net, 2026-09):
//   GET  /pullzone           → all zones, each with Hostnames[].Value
//   GET  /pullzone/{id}      → one zone
//   POST /pullzone/{id}      → partial update; only the fields sent change
// Fields: ErrorPageEnableCustomCode (bool), ErrorPageCustomCode (string).
// Placeholders Bunny fills in the HTML: {{status_code}}, {{status_title}}.

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const API_BASE = "https://api.bunny.net";

/** Region code → pull zone hostname. Live regions only; comingSoon has no zone. */
export const REGIONAL_HOSTS = Object.freeze({
  eu: "eu.onetimesecret.com",
  ca: "ca.onetimesecret.com",
  nz: "nz.onetimesecret.com",
  us: "us.onetimesecret.com",
  uk: "uk.onetimesecret.com",
});

const TEMPLATE_URL = new URL("./regional.html", import.meta.url);

/**
 * @typedef {object} PullZone
 * @property {number} Id
 * @property {string} Name
 * @property {{ Value: string }[]} [Hostnames]
 * @property {boolean | null} [ErrorPageEnableCustomCode]
 * @property {string | null} [ErrorPageCustomCode]
 */

/**
 * @typedef {object} ZonePlan
 * @property {string} region
 * @property {string} host
 * @property {number} id
 * @property {string} name
 * @property {"up-to-date" | "update"} action
 * @property {string} reason
 */

/**
 * Line endings are the one thing the API is allowed to rewrite on the way
 * through; everything else must match byte for byte.
 * @param {string | null | undefined} html
 */
export function normalize(html) {
  return (html ?? "").replace(/\r\n/g, "\n").trim();
}

/**
 * Resolves each wanted region to exactly one pull zone by hostname. A region
 * with no zone, or a hostname claimed by two zones, is a hard error: this
 * writes production config and must not guess.
 *
 * @param {PullZone[]} zones
 * @param {Record<string, string>} hosts region → hostname
 * @returns {{ region: string, host: string, zone: PullZone }[]}
 */
export function selectRegionalZones(zones, hosts = REGIONAL_HOSTS) {
  const byHost = new Map();
  for (const zone of zones) {
    for (const { Value } of zone.Hostnames ?? []) {
      const host = Value.toLowerCase();
      if (byHost.has(host) && byHost.get(host).Id !== zone.Id) {
        throw new Error(
          `Hostname ${host} is attached to two pull zones ` +
            `(${byHost.get(host).Id} and ${zone.Id}); refusing to pick one`,
        );
      }
      byHost.set(host, zone);
    }
  }

  const missing = [];
  const selected = [];
  for (const [region, host] of Object.entries(hosts)) {
    const zone = byHost.get(host);
    if (!zone) {
      missing.push(host);
      continue;
    }
    selected.push({ region, host, zone });
  }
  if (missing.length) {
    throw new Error(`No pull zone carries hostname(s): ${missing.join(", ")}`);
  }
  return selected;
}

/**
 * @param {{ region: string, host: string, zone: PullZone }} selected
 * @param {string} html the desired page
 * @returns {ZonePlan}
 */
export function planZone({ region, host, zone }, html) {
  const base = { region, host, id: zone.Id, name: zone.Name };
  if (!zone.ErrorPageEnableCustomCode) {
    return { ...base, action: "update", reason: "custom error page disabled" };
  }
  if (normalize(zone.ErrorPageCustomCode) !== normalize(html)) {
    return { ...base, action: "update", reason: "page content differs" };
  }
  return { ...base, action: "up-to-date", reason: "" };
}

/**
 * Narrows REGIONAL_HOSTS to the regions named on the command line.
 * @param {string[]} regions
 * @param {Record<string, string>} hosts
 */
export function pickRegions(regions, hosts = REGIONAL_HOSTS) {
  if (regions.length === 0) return hosts;
  const unknown = regions.filter((r) => !(r in hosts));
  if (unknown.length) {
    throw new Error(
      `Unknown region(s): ${unknown.join(", ")}. ` +
        `Known: ${Object.keys(hosts).join(", ")}`,
    );
  }
  return Object.fromEntries(regions.map((r) => [r, hosts[r]]));
}

/**
 * @param {string} apiKey
 * @param {string} path
 * @param {{ method?: string, body?: unknown }} [init]
 */
async function bunny(apiKey, path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      AccessKey: apiKey,
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = (await res.text()).slice(0, 300);
    throw new Error(`${method} ${path} → HTTP ${res.status}${text ? `: ${text}` : ""}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

/**
 * Bunny returns a bare array without a `page` parameter and a paginated
 * `{ Items, HasMoreItems }` object with one. Accept both, refuse to silently
 * work from a partial list.
 * @param {string} apiKey
 * @returns {Promise<PullZone[]>}
 */
async function listPullZones(apiKey) {
  const data = await bunny(apiKey, "/pullzone?perPage=1000");
  if (Array.isArray(data)) return data;
  if (data?.HasMoreItems) {
    throw new Error("More than 1000 pull zones; add pagination to push.mjs");
  }
  if (Array.isArray(data?.Items)) return data.Items;
  throw new Error("Unexpected shape from GET /pullzone");
}

/**
 * @param {string} apiKey
 * @param {ZonePlan} plan
 * @param {string} html
 */
async function applyZone(apiKey, plan, html) {
  await bunny(apiKey, `/pullzone/${plan.id}`, {
    method: "POST",
    body: { ErrorPageEnableCustomCode: true, ErrorPageCustomCode: html },
  });
  /** @type {PullZone} */
  const after = await bunny(apiKey, `/pullzone/${plan.id}`);
  const verified = planZone({ region: plan.region, host: plan.host, zone: after }, html);
  if (verified.action !== "up-to-date") {
    throw new Error(`${plan.host}: pushed, but read-back still says "${verified.reason}"`);
  }
}

/** @param {ZonePlan} plan */
function describe(plan) {
  const state = plan.action === "up-to-date" ? "up-to-date" : `needs update (${plan.reason})`;
  return `${plan.region.padEnd(3)} ${plan.host.padEnd(24)} zone ${plan.id}  ${state}`;
}

/** @param {string[]} argv */
export async function main(argv) {
  const apply = argv.includes("--apply");
  const regions = argv.filter((a) => !a.startsWith("--"));

  const apiKey = process.env.BUNNY_API_KEY;
  if (!apiKey) {
    throw new Error("BUNNY_API_KEY is not set");
  }

  const html = normalize(await readFile(TEMPLATE_URL, "utf8"));
  if (!html.includes("{{status_code}}")) {
    throw new Error("regional.html lost its {{status_code}} placeholder");
  }

  const hosts = pickRegions(regions);
  const zones = await listPullZones(apiKey);
  const plans = selectRegionalZones(zones, hosts).map((s) => planZone(s, html));

  for (const plan of plans) console.log(describe(plan));

  const pending = plans.filter((p) => p.action === "update");
  if (pending.length === 0) {
    console.log("All zones match regional.html.");
    return 0;
  }
  if (!apply) {
    console.log(`${pending.length} zone(s) differ. Re-run with --apply to push.`);
    return 1;
  }

  for (const plan of pending) {
    await applyZone(apiKey, plan, html);
    console.log(`${plan.host}: pushed and verified`);
  }
  return 0;
}

// Only run when executed directly, so the pure helpers stay importable by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(2);
    },
  );
}
