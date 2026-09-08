#!/usr/bin/env node
// edge/error-page/cli.mjs
//
// Keeps the custom error page of every regional pull zone equal to
// edge/error-page/regional.html, so the five zones never drift from the file
// in git or from each other. Three pnpm scripts run this file with a command:
//
//   pnpm edge:error-page:push              # report drift, exit 1 if any differs
//   pnpm edge:error-page:push --apply      # push the file to every zone that differs
//   pnpm edge:error-page:verify            # check every zone, print the manual checks
//   pnpm edge:error-page:deploy            # push then verify, one region at a time
//
// All three take the same region arguments:
//
//   pnpm edge:error-page:deploy eu uk        # limit to some regions
//   pnpm edge:error-page:deploy nz=<zone>    # name the zone for a region (name or ID)
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

export const COMMANDS = Object.freeze(["push", "verify", "deploy", "probe"]);

const USAGE = `Usage: pnpm edge:error-page:<push|verify|deploy|probe> [--apply] [region[=zone] ...]

Keeps the custom error page of the regional Bunny pull zones equal to
edge/error-page/regional.html.

Commands:
  push          report which zones differ from the file; exit 1 if any do.
                With --apply, push the file to every zone that differs and
                read each one back.
  verify        read every zone and check its page is enabled and equal to
                the file; writes nothing. Ends with the one check left to
                do by hand: seeing the page served.
  deploy        push and verify one region at a time, in the order given,
                stopping at the first failure so it never reaches the next
                zone. Zones already up to date are only verified.
  probe         fetch each region's public URL and report whether Bunny
                served the custom page. Only meaningful with the origin
                down: Bunny substitutes the page for its own errors, never
                for the app's. Needs no API key; exit 1 unless every region
                served it.

Arguments, the same for all three:
  --apply       push only: write to the zones that differ
  --help        show this text
  region ...    limit to these regions: ${Object.keys(REGIONAL_HOSTS).join(", ")}
  region=zone   use this pull zone (name or numeric ID) for the region,
                e.g. nz=shield-3f9a2c or nz=123456; overrides the environment
  region=host   probe only: fetch this hostname for the region instead of
                the public one, e.g. nz=be2169e1-7.b-cdn.net when the public
                hostname does not route through the zone yet

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
  return `${prefix(plan)}  ${state}`;
}

/** @param {ZonePlan} plan */
function prefix(plan) {
  return `${plan.region.padEnd(3)} ${plan.host.padEnd(24)} zone ${plan.id} (${plan.name})`;
}

/**
 * @typedef {object} Verification
 * @property {ZonePlan} plan planned against a fresh read of the zone
 * @property {boolean} ok page enabled and equal to the file
 * @property {string} origin the zone's OriginUrl, for eyeballing
 * @property {string[]} hostnames the zone's hostnames, for eyeballing
 */

/**
 * Reads one zone fresh and checks its page the same way a push read-back
 * does: enabled, and equal to the file after normalization. Writes nothing.
 * @param {Client} client
 * @param {{ region: string, host: string, zone: PullZone }} selected
 * @param {string} html
 * @returns {Promise<Verification>}
 */
async function verifyZone(client, { region, host, zone }, html) {
  /** @type {PullZone & { OriginUrl?: string | null }} */
  const fresh = await bunny(client, `/pullzone/${zone.Id}`);
  const plan = planZone({ region, host, zone: fresh }, html);
  return {
    plan,
    ok: plan.action === "up-to-date",
    origin: fresh.OriginUrl ?? "",
    hostnames: (fresh.Hostnames ?? []).map((h) => h.Value),
  };
}

/** @param {Verification} v */
function describeVerification(v) {
  const state = v.ok ? "OK" : `FAIL (${v.plan.reason})`;
  const detail = `origin ${v.origin || "(none)"}; hostnames ${v.hostnames.join(", ") || "(none)"}`;
  return `${prefix(v.plan)}  ${state}\n    ${detail}`;
}

/**
 * The one check the script cannot run on its own: Bunny serves the custom
 * page only for errors it generates itself (origin unreachable or timed
 * out), so seeing it served takes an origin that is down. Printed after
 * verify and after a successful deploy, naming the probe for the regions
 * just handled. The config and content checks by hand live in
 * edge/README.md; the script just ran them.
 * @param {ZonePlan[]} plans
 */
export function servingCheck(plans) {
  const regions = plans.map((p) => p.region).join(" ");
  return `
Bunny serves this page only for errors it generates itself (origin down or
timed out); a 500 from the app passes through untouched. To see it served,
take the origin down, then:
  pnpm edge:error-page:probe ${regions}
Config and content checks by hand: edge/README.md, "Regional error page".
`;
}

/**
 * The template's <title>, the one line of the page the app never sends, so
 * finding it in a response means Bunny substituted the custom page.
 * @param {string} html
 */
export function pageMarker(html) {
  const m = /<title>[^<]*<\/title>/i.exec(html);
  if (!m) throw new Error("regional.html has no <title>; the probe needs one to recognise the page");
  return m[0];
}

/**
 * @typedef {object} Probe
 * @property {string} region
 * @property {string} host
 * @property {number} status 0 when the request itself failed
 * @property {"served" | "origin" | "direct" | "other" | "unfilled" | "error"} outcome
 * @property {string} detail
 * @property {string} [zone] the pull zone ID Bunny reported, when it answered
 */

/**
 * Fetches a region's public URL once, straight through the pull zone, and
 * classifies what came back. Redirects are not followed: a 3xx is the app
 * answering, which is all the probe needs to know about it. Bunny stamps
 * every answer with CDN-PullZone and CDN-Cache; their absence means the
 * hostname is not routed through Bunny at all, which no origin outage would
 * change.
 * @param {typeof fetch} fetchImpl
 * @param {string} region
 * @param {string} host
 * @param {string} marker
 * @returns {Promise<Probe>}
 */
export async function probeRegion(fetchImpl, region, host, marker) {
  const url = `https://${host}/`;
  let status;
  let body;
  let zone;
  let cache;
  try {
    const res = await fetchImpl(url, {
      redirect: "manual",
      cache: "no-store",
      headers: { Accept: "text/html" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    status = res.status;
    body = await res.text();
    zone = res.headers.get("cdn-pullzone") ?? undefined;
    cache = res.headers.get("cdn-cache") ?? undefined;
  } catch (err) {
    // Node's fetch says "fetch failed" and keeps the reason (DNS, TLS, reset) in cause.
    const cause = err instanceof Error && err.cause instanceof Error ? `: ${err.cause.message.trim()}` : "";
    const detail = err instanceof Error ? err.message : String(err);
    return { region, host, status: 0, outcome: "error", detail: `request failed: ${detail}${cause}` };
  }
  const via = zone ? `via pull zone ${zone}` : "not via Bunny";
  if (!zone) {
    return {
      region,
      host,
      status,
      outcome: "direct",
      detail: `${via}: no CDN-PullZone header, so ${host} does not route through the zone`,
    };
  }
  const isPage = body.includes(marker);
  if (status < 500) {
    const cached = cache ? `, cache ${cache}` : "";
    return {
      region,
      host,
      status,
      outcome: "origin",
      zone,
      detail: `${via}${cached}: the origin answered, so the custom page was not exercised`,
    };
  }
  if (!isPage) {
    return { region, host, status, outcome: "other", zone, detail: `${via}: not the custom page` };
  }
  // The template's own hide script and header comment mention "{{", so only
  // the real placeholder tokens count as unfilled.
  if (REQUIRED_PLACEHOLDERS.some((t) => body.includes(t))) {
    return {
      region,
      host,
      status,
      outcome: "unfilled",
      zone,
      detail: `${via}: custom page served with a placeholder Bunny did not fill`,
    };
  }
  return { region, host, status, outcome: "served", zone, detail: `${via}: custom page served` };
}

/** @param {Probe} p */
function describeProbe(p) {
  const status = p.status ? String(p.status) : "---";
  return `${p.region.padEnd(3)} ${p.host.padEnd(24)} ${status}  ${p.detail}`;
}

/**
 * What to do next, by what went wrong. One paragraph, not one per region:
 * the region lines above already say which is which.
 * @param {Probe[]} notServed
 */
function probeAdvice(notServed) {
  const outcomes = new Set(notServed.map((p) => p.outcome));
  const lines = [];
  if (outcomes.has("origin")) {
    lines.push(
      "Bunny substitutes the custom page only for errors it generates itself, so a healthy",
      "origin never shows it. To exercise it: in dash.bunny.net set the zone's origin URL to a",
      "closed port (or stop the origin), re-run this probe, then restore the origin URL.",
    );
  }
  if (outcomes.has("direct")) {
    lines.push(
      "A hostname that does not route through Bunny cannot show the page whatever the origin",
      "does. Probe the zone's own hostname instead, region=<name>.b-cdn.net (verify prints it),",
      "and check the DNS for the public hostname.",
    );
  }
  if (outcomes.has("other") || outcomes.has("unfilled")) {
    lines.push(
      "A 5xx without the page, or with a bare placeholder, means the zone is not serving what",
      "verify says it stores. Re-run verify for that region; a cached copy (CDN-Cache HIT) can",
      "also stand in for the origin until it expires or is purged.",
    );
  }
  if (outcomes.has("error")) {
    lines.push("A failed request never reached Bunny; the reason is on the region's line above.");
  }
  return lines.join("\n");
}

/**
 * @typedef {object} Run what every command works from
 * @property {Client} client
 * @property {{ region: string, host: string, zone: PullZone }[]} selected
 * @property {string} html
 * @property {boolean} apply
 * @property {(line: string) => void} log
 * @property {(line: string) => void} error
 */

/** @param {Run} run */
async function pushCommand({ client, selected, html, apply, log, error }) {
  const plans = selected.map((s) => planZone(s, html));
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

/** @param {Run} run */
async function verifyCommand({ client, selected, html, log }) {
  const results = [];
  for (const s of selected) results.push(await verifyZone(client, s, html));
  for (const v of results) log(describeVerification(v));

  const failed = results.filter((v) => !v.ok);
  if (failed.length) {
    log(`${failed.length} zone(s) failed verification.`);
    return 1;
  }
  log(servingCheck(results.map((v) => v.plan)));
  log("All zones verified.");
  return 0;
}

/**
 * One region at a time: read it fresh, push if it differs, verify, then move
 * on. Unlike push --apply this stops at the first failure, so a push that
 * misbehaves on one production zone is not repeated on the next four.
 * @param {Run} run
 */
async function deployCommand({ client, selected, html, log, error }) {
  const done = [];
  for (const [i, s] of selected.entries()) {
    const fresh = await bunny(client, `/pullzone/${s.zone.Id}`);
    const plan = planZone({ ...s, zone: fresh }, html);
    try {
      if (plan.action === "update") {
        log(describe(plan));
        await applyZone(client, plan, html);
        log(`${plan.host}: pushed`);
      } else {
        log(`${describe(plan)}, nothing to push`);
      }
      const v = await verifyZone(client, s, html);
      log(describeVerification(v));
      if (!v.ok) throw new Error(`verification failed: ${v.plan.reason}`);
      done.push(v.plan);
    } catch (err) {
      error(`${plan.host}: FAILED — ${err instanceof Error ? err.message : err}`);
      const remaining = selected.slice(i + 1).map((r) => r.region);
      if (remaining.length) {
        error(`Stopped before ${remaining.join(", ")}; nothing was written to those zones.`);
      }
      log(`${done.length} zone(s) deployed, 1 failed, ${remaining.length} not attempted.`);
      return 2;
    }
  }
  log(servingCheck(done));
  log(`${done.length} zone(s) deployed and verified.`);
  return 0;
}

/**
 * No API, no zone lookup: one GET per region through its public hostname.
 * Exit 0 only when every region served the custom page, so a run with the
 * origin up fails loudly instead of passing by accident.
 * @param {{ fetch: typeof fetch, hosts: Record<string, string>, html: string,
 *   log: (line: string) => void }} run
 */
async function probeCommand({ fetch: fetchImpl, hosts, html, log }) {
  const marker = pageMarker(html);
  const results = [];
  for (const [region, host] of Object.entries(hosts)) {
    results.push(await probeRegion(fetchImpl, region, host, marker));
  }
  for (const p of results) log(describeProbe(p));

  const notServed = results.filter((p) => p.outcome !== "served");
  if (notServed.length === 0) {
    log("Every region served the custom page.");
    return 0;
  }
  const inconclusive = notServed.every((p) => p.outcome === "origin");
  log(
    inconclusive
      ? `${notServed.length} region(s) answered from the origin; nothing proven.`
      : `${notServed.length} region(s) did not serve the custom page.`,
  );
  log(`\n${probeAdvice(notServed)}`);
  return 1;
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
 * @param {string[]} argv the command, then its arguments
 * @param {Deps} [deps]
 * @returns {Promise<number>} exit code: 0 clean, 1 drift, a failed
 *   verification, or a probe that did not see the page, 2 a push failed
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
  const [command, ...args] = argv;
  if (!COMMANDS.includes(command)) {
    throw new Error(
      `Unknown command "${command ?? ""}"; expected ${COMMANDS.join(", ")}\n\n${USAGE}`,
    );
  }
  const unknownFlags = args.filter((a) => a.startsWith("-") && a !== "--apply");
  if (unknownFlags.length) {
    throw new Error(`Unknown option(s): ${unknownFlags.join(", ")}\n\n${USAGE}`);
  }
  const apply = args.includes("--apply");
  if (apply && command !== "push") {
    const why = { verify: "verify never writes", deploy: "deploy always pushes" }[command] ??
      `${command} never writes`;
    throw new Error(`--apply is for push only; ${why}. Drop the flag.`);
  }
  const { regions, refs: argRefs } = parseRegionArgs(args.filter((a) => !a.startsWith("-")));
  const hosts = pickRegions(regions);

  if (command === "probe") {
    // region=host swaps in the hostname to fetch, for a public hostname that
    // does not (yet) route through the pull zone; the zone's *.b-cdn.net one does.
    const bad = Object.entries(argRefs).filter(([, h]) => !h.includes("."));
    if (bad.length) {
      throw new Error(
        `probe takes region=hostname, not a zone name or ID: ${bad.map(([r, h]) => `${r}=${h}`).join(", ")}`,
      );
    }
    const html = await readFile(TEMPLATE_PATH, "utf8");
    return probeCommand({ fetch: fetchImpl, hosts: { ...hosts, ...argRefs }, html, log });
  }

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
  const selected = selectRegionalZones(zones, hosts, refs);
  const run = { client, selected, html, apply, log, error };

  if (command === "verify") return verifyCommand(run);
  if (command === "deploy") return deployCommand(run);
  return pushCommand(run);
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
