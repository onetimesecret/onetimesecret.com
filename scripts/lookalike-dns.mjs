#!/usr/bin/env node
// scripts/lookalike-dns.mjs
//
// Sets and checks the DNS records of the lookalike domains on Bunny DNS, so
// every domain carries the same record set and nothing is typed by hand:
//
//   pnpm lookalike:dns:check                    # every domain in the inventory
//   pnpm lookalike:dns:check onetimesecret.co   # one or more domains
//   pnpm lookalike:dns:set onetimesecret.co     # make the zone match RECORDS
//   pnpm lookalike:dns:set example.tld --create # add the zone first
//
// The record set is RECORDS below. `set` makes the names it manages (@, *,
// _dmarc) hold exactly those records: it adds what is missing, corrects what
// differs and deletes anything else at those names. Records at other names are
// listed and left alone. It also turns on DNSSEC signing and prints the DS
// record for the registrar. `check` writes nothing: it compares the zone with
// RECORDS through the API, then asks a public resolver what the world sees,
// which is where a wrong delegation, a missing DS or a stale cache shows up.
//
// Without domain arguments both commands take the inventory: LOOKALIKE_DOMAINS
// in config/domains.ts plus the LOOKALIKE_DOMAINS environment variable, which
// holds the domains kept out of the repository (same format as the secret of
// that name: bare hostnames, separated by whitespace).
//
// Needs BUNNY_API_KEY, from the environment or the repo-root .env / .env.local,
// like the edge:error-page scripts.
//
// Bunny API surface used (docs.bunny.net OpenAPI spec and Bunny's own
// Terraform provider, 2026-10):
//   GET    /dnszone                       → zones, { Items, HasMoreItems }
//   POST   /dnszone                       → add a zone, body { Domain }
//   GET    /dnszone/{id}                  → one zone with Records[]
//   PUT    /dnszone/{id}/records          → add a record
//   POST   /dnszone/{id}/records/{rid}    → update a record
//   DELETE /dnszone/{id}/records/{rid}    → delete a record
//   POST   /dnszone/{id}/dnssec           → enable signing; returns the DS. On
//     a zone already signed it returns the DS and changes nothing, which is how
//     the Terraform provider reads it on every refresh; `check` relies on that.
// Record Type is numeric (RECORD_TYPES). The apex name is "".

import { randomBytes } from "node:crypto";
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { LOOKALIKE_DOMAINS } from "../config/domains.ts";
import { API_BASE, loadDotenv } from "../edge/error-page/cli.mjs";

/** The lookalike pull zone's own hostname; apex and wildcard both point here. */
export const CDN_HOSTNAME = "onetimesecret-lookalikes.b-cdn.net";

/** TTL for records this script adds or corrects. */
const TTL = 3600;

/** Bunny and Google answer within seconds; anything longer is a hung connection. */
const REQUEST_TIMEOUT_MS = 30_000;

/** Google's JSON DNS API: unquoted TXT data, the AD bit, and a Comment on SERVFAIL. */
export const DOH_URL = "https://dns.google/resolve";

/** Bunny's numeric record types, index = Type. */
export const RECORD_TYPES = Object.freeze([
  "A", "AAAA", "CNAME", "TXT", "MX", "Redirect", "Flatten", "PullZone",
  "SRV", "CAA", "PTR", "Script", "NS", "SVCB", "HTTPS", "TLSA",
]);

/**
 * @typedef {object} Rec a record in comparable form
 * @property {string} type RECORD_TYPES name
 * @property {string} name relative to the zone, "" for the apex
 * @property {string} value
 * @property {number} [priority] MX only
 * @property {number} [flags] CAA only
 * @property {string} [tag] CAA only
 * @property {number} [id] Bunny's record ID, for records read from a zone
 * @property {boolean} [disabled]
 */

/**
 * What every lookalike domain carries. A CNAME at the apex is legal on Bunny
 * DNS, which answers it as flattened A/AAAA records. The mail records stop the
 * domain sending or receiving mail; CAA limits issuance to the CA Bunny uses
 * (`issue` also covers wildcard certificates while no `issuewild` is set).
 * @type {readonly Rec[]}
 */
export const RECORDS = Object.freeze([
  { type: "CNAME", name: "", value: CDN_HOSTNAME },
  { type: "CNAME", name: "*", value: CDN_HOSTNAME },
  { type: "MX", name: "", value: ".", priority: 0 },
  { type: "TXT", name: "", value: "v=spf1 -all" },
  { type: "TXT", name: "_dmarc", value: "v=DMARC1; p=reject" },
  { type: "CAA", name: "", value: "letsencrypt.org", flags: 0, tag: "issue" },
]);

/** Names `set` owns outright. NS records are never touched (see managedRecords). */
export const MANAGED_NAMES = Object.freeze([...new Set(RECORDS.map((r) => r.name))]);

export const COMMANDS = Object.freeze(["check", "set"]);

const USAGE = `Usage: pnpm lookalike:dns:<check|set> [--create] [domain ...]

Keeps the Bunny DNS zone of each lookalike domain equal to the record set in
scripts/lookalike-dns.mjs (RECORDS).

Commands:
  check         compare each zone with the record set, then query a public
                resolver for delegation, records and DNSSEC. Writes nothing;
                exit 1 if anything differs.
  set           add, correct and delete records at @, * and _dmarc until the
                zone matches, read it back, and enable DNSSEC. Records at other
                names are left alone. Prints the DS record for the registrar.

Arguments:
  domain ...    the domains to work on; default: LOOKALIKE_DOMAINS from
                config/domains.ts plus the LOOKALIKE_DOMAINS variable
  --create      set only: add a Bunny DNS zone for a domain that has none
  --help        show this text

Environment:
  BUNNY_API_KEY       Bunny account API key. Read from the environment, then
                      .env.local, then .env (see .env.example).
  LOOKALIKE_DOMAINS   domains not listed in config/domains.ts, separated by
                      whitespace. Same sources.

Public answers lag zone changes by up to the record TTL (${TTL}s), or the
registry's TTL for nameserver and DS changes. A check right after a set or a
registrar change can fail on a cached answer; run it again later.`;

/**
 * A bare registrable hostname: lower case, no scheme, path or trailing dot.
 * @param {string} raw
 */
export function parseDomain(raw) {
  const domain = raw.trim().toLowerCase().replace(/\.$/, "");
  const label = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";
  if (!new RegExp(`^(?:${label}\\.)+[a-z0-9-]{2,63}$`).test(domain)) {
    throw new Error(`"${raw}" is not a bare hostname (no scheme, path or port)`);
  }
  return domain;
}

/**
 * The domains to work on: the arguments when there are any, otherwise the
 * inventory from config/domains.ts and the environment, deduplicated.
 * @param {string[]} args positional arguments
 * @param {Record<string, string | undefined>} env
 * @param {readonly { domain: string }[]} [inventory]
 */
export function pickDomains(args, env, inventory = LOOKALIKE_DOMAINS) {
  const listed = args.length
    ? args
    : [...inventory.map((d) => d.domain), ...(env.LOOKALIKE_DOMAINS ?? "").split(/\s+/)];
  const domains = [...new Set(listed.filter(Boolean).map(parseDomain))];
  if (domains.length === 0) {
    throw new Error("No domains: name some, or set LOOKALIKE_DOMAINS in .env");
  }
  return domains;
}

/** @param {string} host */
function stripDot(host) {
  return host.toLowerCase().replace(/\.$/, "");
}

/**
 * Bunny's record in the shape RECORDS uses. Names come back relative; "@"
 * and a fully qualified name are folded in too, in case either shows up.
 * @param {Record<string, any>} r a DnsRecordModel
 * @param {string} domain the zone's domain
 * @returns {Rec}
 */
export function fromBunny(r, domain) {
  const type = RECORD_TYPES[r.Type] ?? `Type${r.Type}`;
  let name = stripDot(r.Name ?? "");
  if (name === "@" || name === domain) name = "";
  else if (name.endsWith(`.${domain}`)) name = name.slice(0, -domain.length - 1);
  // Hostnames compare without case or trailing dot; a null MX is a bare ".".
  let value = r.Value ?? "";
  if (type === "CNAME" || type === "MX") value = stripDot(value) || (type === "MX" ? "." : "");
  const rec = { type, name, value, id: r.Id, disabled: Boolean(r.Disabled) };
  if (type === "MX") rec.priority = r.Priority ?? 0;
  if (type === "CAA") Object.assign(rec, { flags: r.Flags ?? 0, tag: r.Tag ?? "" });
  return rec;
}

/** @param {Rec} want @returns {Record<string, unknown>} AddDnsRecordModel */
export function toBunny(want) {
  return {
    Type: RECORD_TYPES.indexOf(want.type),
    Name: want.name,
    Value: want.value,
    Ttl: TTL,
    Disabled: false,
    ...(want.type === "MX" ? { Priority: want.priority } : {}),
    ...(want.type === "CAA" ? { Flags: want.flags, Tag: want.tag } : {}),
  };
}

/** @param {Rec} a @param {Rec} b */
function sameKey(a, b) {
  return a.type === b.type && a.name === b.name && (a.type !== "CAA" || a.tag === b.tag);
}

/** @param {Rec} have @param {Rec} want */
function sameValue(have, want) {
  return (
    have.value === want.value &&
    (want.priority === undefined || have.priority === want.priority) &&
    (want.flags === undefined || have.flags === want.flags) &&
    !have.disabled
  );
}

/**
 * Records `set` owns: everything at a managed name except NS, which a zone
 * may list for its own apex and which is never ours to delete.
 * @param {Rec[]} records
 */
function managedRecords(records) {
  return records.filter((r) => MANAGED_NAMES.includes(r.name) && r.type !== "NS");
}

/**
 * @typedef {object} Step
 * @property {"ok" | "add" | "update" | "delete" | "other"} action
 * @property {Rec} [want] the record from RECORDS
 * @property {Rec} [have] the record in the zone
 */

/**
 * What it takes to turn the zone's records into RECORDS. Each wanted record
 * claims an exact match first, then one with the same type and name (and CAA
 * tag) to correct in place; managed records nobody claimed are deleted.
 * Records at other names come back as "other", never touched.
 * @param {Rec[]} records the zone's records, through fromBunny
 * @param {readonly Rec[]} [wanted]
 * @returns {Step[]}
 */
export function planRecords(records, wanted = RECORDS) {
  const unclaimed = managedRecords(records);
  const claim = (/** @type {(r: Rec) => boolean} */ test) => {
    const i = unclaimed.findIndex(test);
    return i === -1 ? undefined : unclaimed.splice(i, 1)[0];
  };
  /** @type {Step[]} */
  const steps = [];
  for (const want of wanted) {
    const exact = claim((r) => sameKey(r, want) && sameValue(r, want));
    if (exact) {
      steps.push({ action: "ok", want, have: exact });
      continue;
    }
    const near = claim((r) => sameKey(r, want));
    steps.push(near ? { action: "update", want, have: near } : { action: "add", want });
  }
  for (const have of unclaimed) steps.push({ action: "delete", have });
  const managed = new Set(managedRecords(records));
  for (const have of records) {
    if (!managed.has(have)) steps.push({ action: "other", have });
  }
  return steps;
}

/** @param {Rec} r the record's data as a zone file writes it */
function rdata(r) {
  if (r.type === "MX") return `${r.priority} ${r.value}`;
  if (r.type === "CAA") return `${r.flags} ${r.tag} "${r.value}"`;
  return r.value;
}

/** @param {Rec} r */
function show(r) {
  return `${r.type.padEnd(5)} ${(r.name || "@").padEnd(6)} ${rdata(r)}`;
}

/** @param {Step} step */
export function describeStep(step) {
  const { action, want, have } = step;
  if (action === "ok") return `  zone    ok      ${show(want)}`;
  if (action === "add") return `  zone    missing ${show(want)}`;
  if (action === "update") {
    const is = `is ${JSON.stringify(rdata(have))}${have.disabled ? ", disabled" : ""}`;
    return `  zone    differs ${show(want)}  (${is})`;
  }
  if (action === "delete") return `  zone    extra   ${show(have)}`;
  return `  zone    other   ${show(have)}  (not managed, left alone)`;
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
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Every zone on the account, refusing to work from a partial list.
 * @param {Client} client
 * @returns {Promise<{ Id: number, Domain: string }[]>}
 */
async function listZones(client) {
  const data = await bunny(client, "/dnszone?perPage=1000");
  if (data?.HasMoreItems) throw new Error("More than 1000 DNS zones; add pagination");
  if (!Array.isArray(data?.Items)) throw new Error("Unexpected shape from GET /dnszone");
  return data.Items;
}

/**
 * @typedef {object} Ds what the registrar needs
 * @property {number} keyTag
 * @property {number} algorithm
 * @property {number} digestType
 * @property {string} digest upper-case hex
 */

/**
 * The DS from Bunny's DnsSecDsRecordModel. DigestType is typed as a string
 * there; a name such as "SHA256" is mapped to its number.
 * @param {Record<string, any>} info
 * @returns {Ds}
 */
export function dsFromBunny(info) {
  const raw = String(info.DigestType ?? "");
  const named = { "SHA1": 1, "SHA256": 2, "SHA384": 4 }[raw.toUpperCase().replace(/-/g, "")];
  return {
    keyTag: Number(info.KeyTag),
    algorithm: Number(info.Algorithm),
    digestType: /^\d+$/.test(raw) ? Number(raw) : (named ?? NaN),
    digest: String(info.Digest ?? "").toUpperCase(),
  };
}

/** @param {string} data a DS answer, "2371 13 2 32996839…" @returns {Ds} */
export function parseDs(data) {
  const [keyTag, algorithm, digestType, ...digest] = data.trim().split(/\s+/);
  return {
    keyTag: Number(keyTag),
    algorithm: Number(algorithm),
    digestType: Number(digestType),
    digest: digest.join("").toUpperCase(),
  };
}

/** @param {Ds} ds */
function showDs(ds) {
  return `key tag ${ds.keyTag}, algorithm ${ds.algorithm}, digest type ${ds.digestType}, ` +
    `digest ${ds.digest}`;
}

/** @param {Ds} a @param {Ds} b */
function sameDs(a, b) {
  return a.keyTag === b.keyTag && a.algorithm === b.algorithm &&
    a.digestType === b.digestType && a.digest === b.digest;
}

const DNS_TYPES = Object.freeze({ A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, DS: 43, CAA: 257 });

/**
 * @typedef {object} Answer
 * @property {number} status DNS RCODE: 0 NOERROR, 2 SERVFAIL, 3 NXDOMAIN
 * @property {boolean} ad the resolver validated the answer with DNSSEC
 * @property {string[]} data answers of the asked type only, not the CNAME chain
 * @property {string} comment the resolver's reason, mostly on SERVFAIL
 */

/**
 * @param {typeof fetch} fetchImpl
 * @param {string} name
 * @param {keyof typeof DNS_TYPES} type
 * @returns {Promise<Answer>}
 */
export async function query(fetchImpl, name, type) {
  const url = `${DOH_URL}?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetchImpl(url, {
    headers: { Accept: "application/dns-json" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`DNS query ${name} ${type} → HTTP ${res.status}`);
  const body = await res.json();
  return {
    status: body.Status,
    ad: Boolean(body.AD),
    data: (body.Answer ?? []).filter((a) => a.type === DNS_TYPES[type]).map((a) => a.data),
    comment: body.Comment ?? "",
  };
}

/**
 * @typedef {object} Expectation one public query and the answers it should get
 * @property {string} name fully qualified
 * @property {keyof typeof DNS_TYPES} type
 * @property {string[] | null} expect the whole answer set; null for "any answer"
 * @property {string} label type and relative name, for the output line
 */

/**
 * The public answer each wanted record should produce, grouped by name and
 * type so a set compares whole (an extra CAA or a second SPF shows up). The
 * apex CNAME is flattened, so all that can be asked of it is an A answer; the
 * wildcard is asked through a random label that has no records of its own.
 * @param {string} domain
 * @param {string} label random label for the wildcard
 * @param {readonly Rec[]} [wanted]
 * @returns {Expectation[]}
 */
export function publicExpectations(domain, label, wanted = RECORDS) {
  /** @type {Map<string, Expectation>} */
  const groups = new Map();
  for (const r of wanted) {
    const apexCname = r.type === "CNAME" && r.name === "";
    const type = apexCname ? "A" : r.type;
    const owner = r.name === "*" ? label : r.name;
    const name = owner ? `${owner}.${domain}` : domain;
    const answer =
      r.type === "CNAME" ? `${r.value}.`
      : r.type === "MX" ? `${r.priority} ${r.value === "." ? "." : `${r.value}.`}`
      : r.type === "CAA" ? `${r.flags} ${r.tag} "${r.value}"`
      : r.value;
    const key = `${name} ${type}`;
    const group = groups.get(key) ?? {
      name,
      type,
      expect: apexCname ? null : [],
      label: `${type.padEnd(5)} ${(r.name || "@").padEnd(6)}`,
    };
    if (group.expect) group.expect.push(answer);
    groups.set(key, group);
  }
  return [...groups.values()];
}

/**
 * @typedef {object} Finding
 * @property {boolean} ok
 * @property {string} line
 */

/**
 * What a public resolver says about the domain: delegation to the zone's
 * nameservers, each record set, and DNSSEC from registry DS to validated
 * answer.
 * @param {typeof fetch} fetchImpl
 * @param {string} domain
 * @param {{ nameservers: string[], ds: Ds | null }} zone ds is null when the
 *   zone is not signed
 * @param {string} label random label for the wildcard
 * @returns {Promise<Finding[]>}
 */
export async function checkPublic(fetchImpl, domain, zone, label) {
  /** @type {Finding[]} */
  const findings = [];
  /** @param {boolean} ok @param {string} what @param {string} [detail] */
  const add = (ok, what, detail) => {
    const state = ok ? "ok    " : "FAIL  ";
    findings.push({ ok, line: `  public  ${state}  ${what}${detail ? `  ${detail}` : ""}` });
  };

  const ns = await query(fetchImpl, domain, "NS");
  const seen = ns.data.map(stripDot).sort();
  const want = zone.nameservers.map(stripDot).sort();
  const delegated = seen.join(" ") === want.join(" ");
  add(delegated, `NS           ${seen.join(" ") || "(none)"}`,
    delegated ? "" : `(set the registrar's nameservers to ${want.join(" ")})`);

  let apex;
  for (const { name, type, expect, label: what } of publicExpectations(domain, label)) {
    const answer = await query(fetchImpl, name, type);
    if (type === "A" && name === domain) apex = answer;
    if (answer.status === 2) {
      add(false, what, `SERVFAIL${answer.comment ? `: ${answer.comment}` : ""}`);
      continue;
    }
    if (expect === null) {
      add(answer.data.length > 0, `${what} ${answer.data.join(" ") || "(no answer)"}`);
      continue;
    }
    const got = [...answer.data].sort();
    const ok = got.join("\n") === [...expect].sort().join("\n");
    add(ok, `${what} ${got.map((d) => JSON.stringify(d)).join(" ") || "(no answer)"}`,
      ok ? "" : `(want ${expect.map((d) => JSON.stringify(d)).join(" ")})`);
  }

  const parent = (await query(fetchImpl, domain, "DS")).data.map(parseDs);
  if (!zone.ds) {
    add(false, "DNSSEC", parent.length
      ? "the registry has a DS but the zone is unsigned, so validating resolvers SERVFAIL; " +
        "run set to sign it, or remove the DS at the registrar"
      : "zone unsigned; run set to sign it");
  } else if (parent.length === 0) {
    add(false, "DNSSEC",
      `zone signed, no DS at the registry; add it at the registrar: ${showDs(zone.ds)}`);
  } else if (!parent.some((p) => sameDs(p, zone.ds))) {
    add(false, "DNSSEC", `the registry's DS (${parent.map(showDs).join("; ")}) does not match ` +
      `the zone; replace it with: ${showDs(zone.ds)}`);
  } else {
    const validated = Boolean(apex?.ad);
    add(validated, "DNSSEC", validated
      ? `DS ${zone.ds.keyTag} at the registry, answers validate`
      : "DS matches, but the resolver did not validate the apex answer (AD bit unset)");
  }
  return findings;
}

/**
 * @typedef {object} Zone
 * @property {number} Id
 * @property {string} Domain
 * @property {Record<string, any>[]} [Records]
 * @property {string} [Nameserver1]
 * @property {string} [Nameserver2]
 * @property {boolean} [DnsSecEnabled]
 */

/**
 * @param {Client} client
 * @param {number} id
 * @returns {Promise<Zone>}
 */
function getZone(client, id) {
  return bunny(client, `/dnszone/${id}`);
}

/** @param {Zone} zone */
function nameservers(zone) {
  return [zone.Nameserver1, zone.Nameserver2].filter(Boolean);
}

/** @param {Zone} zone a full zone, from getZone */
function zoneSteps(zone) {
  return planRecords((zone.Records ?? []).map((r) => fromBunny(r, zone.Domain.toLowerCase())));
}

/** @param {Step} step */
function isChange(step) {
  return step.action !== "ok" && step.action !== "other";
}

/**
 * @param {{ client: Client, fetch: typeof fetch, domain: string, zone: Zone | undefined,
 *   random: () => string, log: (line: string) => void }} run
 * @returns {Promise<number>} problems found
 */
async function checkDomain({ client, fetch: fetchImpl, domain, zone, random, log }) {
  if (!zone) {
    log(`${domain}  no Bunny DNS zone; run: pnpm lookalike:dns:set ${domain} --create`);
    return 1;
  }
  const fresh = await getZone(client, zone.Id);
  const ds = fresh.DnsSecEnabled
    ? dsFromBunny(await bunny(client, `/dnszone/${zone.Id}/dnssec`, { method: "POST" }))
    : null;
  const ns = nameservers(fresh);
  log(`${domain}  zone ${zone.Id}  ns ${ns.join(" ")}  dnssec ${ds ? "on" : "off"}`);

  const steps = zoneSteps(fresh);
  for (const step of steps) log(describeStep(step));
  const drift = steps.filter(isChange).length;

  const findings = await checkPublic(fetchImpl, domain, { nameservers: ns, ds }, `x-${random()}`);
  for (const f of findings) log(f.line);
  return drift + findings.filter((f) => !f.ok).length;
}

/**
 * Applies the plan: deletes first, so an apex A left over from an import is
 * gone before the apex CNAME arrives, then corrections, then additions. The
 * zone is read back and planned again; anything still not "ok" is an error.
 * @param {Client} client
 * @param {Zone} zone
 * @param {Step[]} steps
 * @param {(line: string) => void} log
 */
async function applySteps(client, zone, steps, log) {
  const base = `/dnszone/${zone.Id}/records`;
  for (const { have } of steps.filter((s) => s.action === "delete")) {
    await bunny(client, `${base}/${have.id}`, { method: "DELETE" });
    log(`  deleted ${show(have)}`);
  }
  for (const { want, have } of steps.filter((s) => s.action === "update")) {
    const body = { Id: have.id, ...toBunny(want) };
    await bunny(client, `${base}/${have.id}`, { method: "POST", body });
    log(`  updated ${show(want)}`);
  }
  for (const { want } of steps.filter((s) => s.action === "add")) {
    await bunny(client, base, { method: "PUT", body: toBunny(want) });
    log(`  added   ${show(want)}`);
  }
  const after = await getZone(client, zone.Id);
  const left = zoneSteps(after).filter(isChange);
  if (left.length) {
    throw new Error(`read-back still differs:\n${left.map(describeStep).join("\n")}`);
  }
  return after;
}

/**
 * @param {{ client: Client, domain: string, zone: Zone | undefined, create: boolean,
 *   log: (line: string) => void }} run
 */
async function setDomain({ client, domain, zone, create, log }) {
  if (!zone) {
    if (!create) {
      throw new Error(`no Bunny DNS zone; re-run with --create to add one`);
    }
    await bunny(client, "/dnszone", { method: "POST", body: { Domain: domain } });
    zone = (await listZones(client)).find((z) => z.Domain.toLowerCase() === domain);
    if (!zone) throw new Error("zone created, but it is not in the zone list");
    log(`${domain}  created zone ${zone.Id}`);
  }
  const fresh = await getZone(client, zone.Id);
  log(`${domain}  zone ${zone.Id}`);
  const steps = zoneSteps(fresh);
  const changes = steps.filter(isChange);
  for (const step of steps.filter((s) => s.action === "other")) log(describeStep(step));
  const after = changes.length ? await applySteps(client, fresh, steps, log) : fresh;
  log(changes.length
    ? `  ${changes.length} change(s) applied, read-back matches`
    : "  records already match");

  if (!after.DnsSecEnabled) {
    const ds = dsFromBunny(await bunny(client, `/dnszone/${zone.Id}/dnssec`, { method: "POST" }));
    log(`  DNSSEC enabled. Add this DS at the registrar: ${showDs(ds)}`);
  }
  log(`  registrar nameservers: ${nameservers(after).join(" ")}`);
}

/**
 * @typedef {object} Deps injectable for tests; every default is the real thing
 * @property {Record<string, string | undefined>} [env]
 * @property {typeof fetch} [fetch]
 * @property {() => void} [loadEnv]
 * @property {() => string} [random] the wildcard probe label
 * @property {(line: string) => void} [log]
 * @property {(line: string) => void} [error]
 */

/**
 * @param {string[]} argv the command, then its arguments
 * @param {Deps} [deps]
 * @returns {Promise<number>} exit code: 0 clean, 1 check found problems,
 *   2 a set failed
 */
export async function main(argv, deps = {}) {
  const {
    env = process.env,
    fetch: fetchImpl = globalThis.fetch,
    loadEnv = loadDotenv,
    random = () => randomBytes(6).toString("hex"),
    log = console.log,
    error = console.error,
  } = deps;

  if (argv.includes("--help") || argv.includes("-h")) {
    log(USAGE);
    return 0;
  }
  const [command, ...args] = argv;
  if (!COMMANDS.includes(command)) {
    const expected = COMMANDS.join(", ");
    throw new Error(`Unknown command "${command ?? ""}"; expected ${expected}\n\n${USAGE}`);
  }
  const unknownFlags = args.filter((a) => a.startsWith("-") && a !== "--create");
  if (unknownFlags.length) {
    throw new Error(`Unknown option(s): ${unknownFlags.join(", ")}\n\n${USAGE}`);
  }
  const create = args.includes("--create");
  if (create && command !== "set") throw new Error("--create is for set only; check never writes.");

  loadEnv();
  const domains = pickDomains(args.filter((a) => !a.startsWith("-")), env);
  const apiKey = env.BUNNY_API_KEY;
  if (!apiKey) {
    throw new Error("BUNNY_API_KEY is not set. Export it or add it to .env (see .env.example).");
  }
  const client = { apiKey, fetch: fetchImpl };
  const zones = await listZones(client);
  const zoneFor = (/** @type {string} */ d) => zones.find((z) => z.Domain.toLowerCase() === d);

  if (command === "check") {
    let problems = 0;
    for (const domain of domains) {
      const zone = zoneFor(domain);
      problems += await checkDomain({ client, fetch: fetchImpl, domain, zone, random, log });
    }
    log(problems ? `${problems} problem(s).` : "All domains match.");
    return problems ? 1 : 0;
  }

  // Keep going past a failed domain so one run reports all of them; set is
  // idempotent, so a re-run picks up whatever is still pending.
  const failed = [];
  for (const domain of domains) {
    try {
      await setDomain({ client, domain, zone: zoneFor(domain), create, log });
    } catch (err) {
      failed.push(domain);
      error(`${domain}: FAILED — ${err instanceof Error ? err.message : err}`);
    }
  }
  log(`${domains.length - failed.length} domain(s) set, ${failed.length} failed.` +
    " Public answers lag; run lookalike:dns:check later.");
  return failed.length ? 2 : 0;
}

// Only run when executed directly, so the pure helpers stay importable by tests.
// argv[1] is realpath'd because import.meta.url already is.
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
