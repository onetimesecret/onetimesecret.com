#!/usr/bin/env node
// edge/error-page/push.mjs
//
// Pushes edge/error-page/regional.html to the custom error page setting of
// every regional pull zone, so the five zones never drift from the file in
// git or from each other.
//
//   pnpm edge:error-page:push              # report drift, exit 1 if any differs
//   pnpm edge:error-page:push --apply      # push the file to every zone that differs
//   pnpm edge:error-page:push eu uk        # limit to some regions (either mode)
//   pnpm edge:error-page:push nz=<zone>    # name the zone for a region (name or ID)
//
// Needs BUNNY_API_KEY (the account API key, same secret the deploy workflows
// use to purge), from the environment or from the repo-root .env / .env.local,
// which are loaded if present. It is declared in .env.example.
//
// Zones are found by their public hostname (eu.onetimesecret.com) by default,
// so nothing here has to be updated when such a zone is recreated. A pull zone
// behind Bunny Shield is different: the public hostname terminates at the
// shield, and the zone itself has a generated, non-guessable name and only its
// *.b-cdn.net hostname. Those zones are named per region, by
// BUNNY_PULL_ZONE_<REGION> in the environment or .env, or by a region=zone
// argument, which wins over the environment. Either form takes the zone's
// name or its numeric ID.
//
// Bunny API surface used (verified against docs.bunny.net, 2026-09):
//   GET  /pullzone           → all zones, each with Hostnames[].Value
//   GET  /pullzone/{id}      → one zone
//   POST /pullzone/{id}      → partial update; only the fields sent change
// Fields: ErrorPageEnableCustomCode (bool), ErrorPageCustomCode (string).
// Placeholders Bunny fills in the HTML: {{status_code}}, {{status_title}}.
//
// The partial-update claim is load-bearing: if a POST ever reset other zone
// settings (origin, cache rules, Vary on country code) it would do so on
// production zones. So every push is followed by a read-back that is diffed
// against the zone as it was before, and any change outside the two fields
// sent is reported as an error (see `unexpectedChanges`).

import { realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// Node strips the type annotations at import time (engines: node >= 26), so
// the plain-JS script reads the same inventory as the edge scripts and the
// client instead of keeping its own copy.
import { jurisdictions } from "../../src/data/ops/jurisdictions.ts";

export const API_BASE = "https://api.bunny.net";

/** Bunny answers within a few seconds; anything longer is a hung connection. */
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Region code → pull zone hostname, derived from the canonical jurisdiction
 * list. Live regions only: a comingSoon region has no pull zone yet.
 * @type {Readonly<Record<string, string>>}
 */
export const REGIONAL_HOSTS = Object.freeze(
  Object.fromEntries(
    jurisdictions
      .filter((j) => !j.comingSoon)
      .map((j) => [j.identifier.toLowerCase(), j.domain]),
  ),
);

/**
 * Environment variable naming the pull zone for a region, for zones that do
 * not carry the region's public hostname (see the header). The value is the
 * zone's name or numeric ID.
 * @param {string} region
 */
export function zoneEnvVar(region) {
  return `BUNNY_PULL_ZONE_${region.toUpperCase()}`;
}

/**
 * Zone references from the environment, one per region in `hosts`. Empty
 * values are treated as unset so a blank line in .env.example is harmless.
 * @param {Record<string, string | undefined>} env
 * @param {Record<string, string>} hosts region → hostname
 * @returns {Record<string, string>} region → zone name or ID
 */
export function envZoneRefs(env, hosts = REGIONAL_HOSTS) {
  /** @type {Record<string, string>} */
  const refs = {};
  for (const region of Object.keys(hosts)) {
    const value = env[zoneEnvVar(region)]?.trim();
    if (value) refs[region] = value;
  }
  return refs;
}

/**
 * Splits the positional arguments into regions and per-region zone overrides.
 * `eu` names a region; `nz=some-zone-name` or `nz=123456` names a region and
 * the pull zone to use for it. Region codes are lower-cased here; whether they
 * are known is checked by `pickRegions`.
 * @param {string[]} args positional arguments, flags already removed
 * @returns {{ regions: string[], refs: Record<string, string> }}
 */
export function parseRegionArgs(args) {
  const regions = [];
  /** @type {Record<string, string>} */
  const refs = {};
  for (const arg of args) {
    const eq = arg.indexOf("=");
    const region = (eq === -1 ? arg : arg.slice(0, eq)).toLowerCase();
    if (eq !== -1) {
      const ref = arg.slice(eq + 1).trim();
      if (!region || !ref) {
        throw new Error(`Malformed argument "${arg}"; expected region=<zone name or ID>`);
      }
      refs[region] = ref;
    }
    regions.push(region);
  }
  return { regions, refs };
}

/**
 * Fields the read-back diff ignores: the two this script sends, and the two
 * Bunny updates on its own as traffic flows. Anything else that changes across
 * a push means the partial-update assumption above is wrong.
 */
export const EXPECTED_CHANGES = Object.freeze([
  "ErrorPageEnableCustomCode",
  "ErrorPageCustomCode",
  "MonthlyBandwidthUsed",
  "MonthlyCharges",
]);

const TEMPLATE_PATH = join(import.meta.dirname, "regional.html");
const ROOT_DIR = join(import.meta.dirname, "..", "..");

/** Placeholders the template must keep, or Bunny serves a page with no status. */
const REQUIRED_PLACEHOLDERS = ["{{status_code}}", "{{status_title}}"];

const USAGE = `Usage: pnpm edge:error-page:push [--apply] [region[=zone] ...]

Pushes edge/error-page/regional.html to the custom error page of the
regional Bunny pull zones.

  (no flags)    report which zones differ from the file; exit 1 if any do
  --apply       push the file to every zone that differs, then verify
  --help        show this text
  region ...    limit to these regions: ${Object.keys(REGIONAL_HOSTS).join(", ")}
  region=zone   use this pull zone (name or numeric ID) for the region,
                e.g. nz=shield-3f9a2c or nz=123456; overrides the environment

A zone is found by its public hostname (${REGIONAL_HOSTS.eu}) unless one is
named for the region. A pull zone behind Bunny Shield has a generated name
and does not carry the public hostname, so it has to be named.

Environment:
  BUNNY_API_KEY             Bunny account API key. Read from the environment,
                            then .env.local, then .env (see .env.example).
  BUNNY_PULL_ZONE_<REGION>  pull zone name or numeric ID for one region, e.g.
                            BUNNY_PULL_ZONE_NZ=shield-3f9a2c. Same sources.`;

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
 * Makes the file and the API's copy of it comparable. Line endings may be
 * rewritten on the way through, and a trailing newline (from an editor, or
 * added by Bunny's own editor) is not drift; everything else must match byte
 * for byte.
 * @param {string | null | undefined} html
 */
export function normalize(html) {
  return (html ?? "").replace(/\r\n/g, "\n").trim();
}

/**
 * Resolves each wanted region to exactly one pull zone: the zone named in
 * `refs` (by numeric ID or by name) when there is one, otherwise the zone
 * carrying the region's hostname. A region with no zone, a hostname claimed by
 * two zones, or a named zone that carries another region's hostname is a hard
 * error: this writes production config and must not guess.
 *
 * @param {PullZone[]} zones
 * @param {Record<string, string>} hosts region → hostname
 * @param {Record<string, string>} [refs] region → zone name or ID
 * @returns {{ region: string, host: string, zone: PullZone }[]}
 */
export function selectRegionalZones(zones, hosts = REGIONAL_HOSTS, refs = {}) {
  const byHost = new Map();
  const byName = new Map();
  const byId = new Map();
  for (const zone of zones) {
    byId.set(String(zone.Id), zone);
    byName.set(zone.Name.toLowerCase(), zone);
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
    const ref = refs[region];
    if (ref !== undefined) {
      const zone = /^\d+$/.test(ref) ? byId.get(ref) : byName.get(ref.toLowerCase());
      if (!zone) {
        throw new Error(
          `No pull zone named or numbered "${ref}" (given for ${region}). ` +
            "Check the zone's name or ID in dash.bunny.net.",
        );
      }
      // A zone named for one region must not be another region's zone. The
      // check is against every live region, not just the ones requested.
      const zoneHosts = (zone.Hostnames ?? []).map((h) => h.Value.toLowerCase());
      const other = Object.entries(REGIONAL_HOSTS).find(
        ([r, h]) => r !== region && zoneHosts.includes(h),
      );
      if (other) {
        throw new Error(
          `Pull zone ${zone.Name} (${zone.Id}), given for ${region}, carries ` +
            `${other[1]}, the ${other[0]} hostname; refusing to push to it`,
        );
      }
      selected.push({ region, host, zone });
      continue;
    }
    const zone = byHost.get(host);
    if (!zone) {
      missing.push(region);
      continue;
    }
    selected.push({ region, host, zone });
  }
  if (missing.length) {
    const hostList = missing.map((r) => hosts[r]).join(", ");
    const envList = missing.map((r) => `${zoneEnvVar(r)}=<zone name or ID>`).join(" ");
    const argList = missing.map((r) => `${r}=<zone name or ID>`).join(" ");
    throw new Error(
      `No pull zone carries hostname(s): ${hostList}. A zone behind Bunny Shield ` +
        "does not carry its public hostname; name it with " +
        `${envList} in the environment or .env, or as ${argList} on the command line.`,
    );
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
 * Narrows REGIONAL_HOSTS to the regions named on the command line. Region
 * codes are matched case-insensitively (`EU` and `eu` are the same zone).
 * @param {string[]} regions
 * @param {Record<string, string>} hosts
 */
export function pickRegions(regions, hosts = REGIONAL_HOSTS) {
  if (regions.length === 0) return hosts;
  const wanted = regions.map((r) => r.toLowerCase());
  const unknown = wanted.filter((r) => !(r in hosts));
  if (unknown.length) {
    throw new Error(
      `Unknown region(s): ${unknown.join(", ")}. ` +
        `Known: ${Object.keys(hosts).join(", ")}`,
    );
  }
  return Object.fromEntries(wanted.map((r) => [r, hosts[r]]));
}

/**
 * Bunny returns a bare array without a `page` parameter and a paginated
 * `{ Items, HasMoreItems }` object with one. Accept both, refuse to silently
 * work from a partial list.
 * @param {unknown} data the parsed body of GET /pullzone
 * @returns {PullZone[]}
 */
export function parsePullZoneList(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    if (data.HasMoreItems) {
      throw new Error("More than 1000 pull zones; add pagination to push.mjs");
    }
    if (Array.isArray(data.Items)) return data.Items;
  }
  throw new Error("Unexpected shape from GET /pullzone");
}

/**
 * Names every field that differs between the zone before a push and the
 * read-back after it, apart from the ones a push is expected to change.
 * @param {Record<string, unknown>} before
 * @param {Record<string, unknown>} after
 * @param {readonly string[]} [expected]
 * @returns {string[]} changed field names, empty when the push was clean
 */
export function unexpectedChanges(before, after, expected = EXPECTED_CHANGES) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys]
    .filter((k) => !expected.includes(k))
    .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
    .sort();
}

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
 * @param {Client} client
 * @param {string} path
 * @param {{ method?: string, body?: unknown }} [init]
 */
async function bunny(client, path, { method = "GET", body } = {}) {
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
  if (res.status === 204) return null;
  return res.json();
}

/**
 * @param {Client} client
 * @returns {Promise<PullZone[]>}
 */
async function listPullZones(client) {
  return parsePullZoneList(await bunny(client, "/pullzone?perPage=1000"));
}

/**
 * Pushes the page to one zone, then reads the zone back and checks two
 * things: the page took, and nothing else moved. The "before" snapshot comes
 * from the same single-zone endpoint as the read-back, taken just before the
 * POST, so the diff never compares two differently shaped payloads.
 * @param {Client} client
 * @param {ZonePlan} plan
 * @param {string} html
 */
async function applyZone(client, plan, html) {
  /** @type {PullZone} */
  const before = await bunny(client, `/pullzone/${plan.id}`);
  await bunny(client, `/pullzone/${plan.id}`, {
    method: "POST",
    body: { ErrorPageEnableCustomCode: true, ErrorPageCustomCode: html },
  });
  /** @type {PullZone} */
  const after = await bunny(client, `/pullzone/${plan.id}`);
  const verified = planZone({ region: plan.region, host: plan.host, zone: after }, html);
  if (verified.action !== "up-to-date") {
    throw new Error(`${plan.host}: pushed, but read-back still says "${verified.reason}"`);
  }
  const changed = unexpectedChanges(before, after);
  if (changed.length) {
    throw new Error(
      `${plan.host}: page pushed, but the update also changed ${changed.join(", ")}. ` +
        "Check the zone in dash.bunny.net before pushing again.",
    );
  }
}

/** @param {ZonePlan} plan */
function describe(plan) {
  const state = plan.action === "up-to-date" ? "up-to-date" : `needs update (${plan.reason})`;
  const zone = `zone ${plan.id} (${plan.name})`;
  return `${plan.region.padEnd(3)} ${plan.host.padEnd(24)} ${zone}  ${state}`;
}

/**
 * @typedef {object} Deps injectable for tests; every default is the real thing
 * @property {Record<string, string | undefined>} [env]
 * @property {typeof fetch} [fetch]
 * @property {() => void} [loadEnv]
 * @property {(line: string) => void} [log]
 * @property {(line: string) => void} [error]
 */

/**
 * @param {string[]} argv
 * @param {Deps} [deps]
 * @returns {Promise<number>} exit code: 0 clean, 1 drift reported, 2 a push failed
 */
export async function main(argv, deps = {}) {
  const {
    env = process.env,
    fetch: fetchImpl = globalThis.fetch,
    loadEnv = loadDotenv,
    log = console.log,
    error = console.error,
  } = deps;

  if (argv.includes("--help") || argv.includes("-h")) {
    log(USAGE);
    return 0;
  }
  const unknownFlags = argv.filter((a) => a.startsWith("-") && a !== "--apply");
  if (unknownFlags.length) {
    throw new Error(`Unknown option(s): ${unknownFlags.join(", ")}\n\n${USAGE}`);
  }
  const apply = argv.includes("--apply");
  const { regions, refs: argRefs } = parseRegionArgs(argv.filter((a) => !a.startsWith("-")));
  const hosts = pickRegions(regions);

  loadEnv();
  const apiKey = env.BUNNY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "BUNNY_API_KEY is not set. Export it or add it to .env (see .env.example).",
    );
  }
  const client = { apiKey, fetch: fetchImpl };

  const html = normalize(await readFile(TEMPLATE_PATH, "utf8"));
  const lost = REQUIRED_PLACEHOLDERS.filter((p) => !html.includes(p));
  if (lost.length) {
    throw new Error(`regional.html lost its ${lost.join(" and ")} placeholder(s)`);
  }

  // Command line beats environment, per region.
  const refs = { ...envZoneRefs(env, hosts), ...argRefs };
  const zones = await listPullZones(client);
  const plans = selectRegionalZones(zones, hosts, refs).map((s) => planZone(s, html));

  for (const plan of plans) log(describe(plan));

  const pending = plans.filter((p) => p.action === "update");
  if (pending.length === 0) {
    log("All zones match regional.html.");
    return 0;
  }
  if (!apply) {
    log(`${pending.length} zone(s) differ. Re-run with --apply to push.`);
    return 1;
  }

  // Keep going past a failed zone so one run reports the state of all of
  // them; a re-run is idempotent and picks up whatever is still pending.
  const failed = [];
  for (const plan of pending) {
    try {
      await applyZone(client, plan, html);
      log(`${plan.host}: pushed and verified`);
    } catch (err) {
      failed.push(plan.host);
      error(`${plan.host}: FAILED — ${err instanceof Error ? err.message : err}`);
    }
  }
  const pushed = pending.length - failed.length;
  log(`${pushed} zone(s) pushed, ${failed.length} failed.`);
  return failed.length ? 2 : 0;
}

// Only run when executed directly, so the pure helpers stay importable by tests.
// argv[1] is realpath'd because import.meta.url already is, and a symlinked
// checkout must not turn the script into a silent no-op.
// Sets exitCode rather than calling exit() so buffered output drains when piped.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 2;
    },
  );
}
