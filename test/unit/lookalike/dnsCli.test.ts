/**
 * @file dnsCli.test.ts
 * @description Unit tests for scripts/lookalike-dns.mjs: how Bunny's records
 * are read, what set decides to add, correct and delete, what a public
 * resolver's answers count as, and the order set writes in. Bunny's API and
 * Google's DNS API are both an injected fetch, so no test leaves the process.
 *
 * The failure modes worth pinning are the ones seen on real zones: a TXT
 * value typed with its quotes, an apex with no record after an import, a
 * redundant issuewild, a DS left at the registry for an unsigned zone, and a
 * set that deletes something it does not own (an NS, a record at another name).
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  CDN_HOSTNAME,
  COMMANDS,
  DOH_URL,
  MANAGED_NAMES,
  RECORDS,
  RECORD_TYPES,
  checkPublic,
  describeStep,
  dsFromBunny,
  fromBunny,
  main,
  parseDomain,
  parseDs,
  pickDomains,
  planRecords,
  publicExpectations,
  query,
  toBunny,
} from "../../../scripts/lookalike-dns.mjs";

const SCRIPT = resolve(import.meta.dirname, "../../../scripts/lookalike-dns.mjs");
const DOMAIN = "lookalike.example";
const NS = ["coco.bunny.net", "kiki.bunny.net"];

type BunnyRecord = Record<string, unknown> & {
  Id: number;
  Type: number;
  Name: string;
  Value: string;
};

const type = (name: string) => RECORD_TYPES.indexOf(name);

/** The rejection message of a promise, or "resolved". */
const rejection = (p: Promise<unknown>) =>
  p.then(
    () => "resolved",
    (err: unknown) => (err instanceof Error ? err.message : String(err)),
  );

/** The zone as RECORDS would leave it, in Bunny's shape. */
function goodRecords(): BunnyRecord[] {
  return RECORDS.map((r, i) => ({ Id: i + 1, ...toBunny(r) }) as BunnyRecord);
}

const plan = (records: BunnyRecord[]) => planRecords(records.map((r) => fromBunny(r, DOMAIN)));
const actions = (records: BunnyRecord[]) =>
  plan(records).map((s) => {
    const r = (s.want ?? s.have)!;
    return `${s.action} ${r.type} ${r.name || "@"}`;
  });

describe("parseDomain", () => {
  it("lower-cases and drops a trailing dot", () => {
    expect(parseDomain(" OneTimeSecret.CO. ")).toBe("onetimesecret.co");
  });

  it("accepts punycode labels", () => {
    expect(parseDomain("xn--onetimescret-hlb.com")).toBe("xn--onetimescret-hlb.com");
  });

  it.each(["https://onetimesecret.co", "onetimesecret.co/x", "onetimesecret", "a.b:443", ""])(
    "rejects %j",
    (raw) => {
      expect(() => parseDomain(raw)).toThrow(/not a bare hostname/);
    },
  );
});

describe("pickDomains", () => {
  const inventory = [{ domain: "onetimesecret.co" }, { domain: "onetimesecret.io" }];

  it("takes the arguments when there are any", () => {
    expect(pickDomains(["OTS.example"], { LOOKALIKE_DOMAINS: "x.example" }, inventory)).toEqual([
      "ots.example",
    ]);
  });

  it("otherwise merges the config list with the variable, deduplicated", () => {
    const env = { LOOKALIKE_DOMAINS: "\nonetimesecret.ca\n onetimesecret.co  onetimesecret.nl\n" };
    expect(pickDomains([], env, inventory)).toEqual([
      "onetimesecret.co",
      "onetimesecret.io",
      "onetimesecret.ca",
      "onetimesecret.nl",
    ]);
  });

  it("fails when there is nothing to work on", () => {
    expect(() => pickDomains([], {}, [])).toThrow(/No domains/);
  });
});

describe("RECORDS", () => {
  it("points apex and wildcard at the pull zone and blocks mail", () => {
    expect(RECORDS.map((r) => `${r.type} ${r.name || "@"}`)).toEqual([
      "CNAME @",
      "CNAME *",
      "MX @",
      "TXT @",
      "TXT _dmarc",
      "CAA @",
    ]);
    expect(RECORDS.filter((r) => r.type === "CNAME").every((r) => r.value === CDN_HOSTNAME)).toBe(
      true,
    );
  });

  it("stores TXT values without quotes, which Bunny would publish literally", () => {
    for (const r of RECORDS.filter((x) => x.type === "TXT")) expect(r.value).not.toMatch(/"/);
  });

  it("manages exactly the names it sets", () => {
    expect([...MANAGED_NAMES].sort()).toEqual(["", "*", "_dmarc"]);
  });
});

describe("fromBunny", () => {
  it("folds '@' and a fully qualified name into the relative form", () => {
    const at = fromBunny({ Id: 1, Type: type("TXT"), Name: "@", Value: "x" }, DOMAIN);
    const fq = fromBunny(
      { Id: 2, Type: type("TXT"), Name: `_dmarc.${DOMAIN}.`, Value: "x" },
      DOMAIN,
    );
    expect(at.name).toBe("");
    expect(fq.name).toBe("_dmarc");
  });

  it("compares hostnames without case or trailing dot, and keeps a null MX as '.'", () => {
    const cname = fromBunny(
      { Id: 1, Type: type("CNAME"), Name: "*", Value: "Host.B-CDN.net." },
      DOMAIN,
    );
    const mx = fromBunny({ Id: 2, Type: type("MX"), Name: "", Value: ".", Priority: 0 }, DOMAIN);
    expect(cname.value).toBe("host.b-cdn.net");
    expect(mx).toMatchObject({ value: ".", priority: 0 });
  });

  it("keeps a TXT value byte for byte, quotes included", () => {
    const txt = fromBunny({ Id: 1, Type: type("TXT"), Name: "", Value: '"v=spf1 -all"' }, DOMAIN);
    expect(txt.value).toBe('"v=spf1 -all"');
  });

  it("reads CAA flags and tag", () => {
    const caa = fromBunny(
      { Id: 1, Type: type("CAA"), Name: "", Value: "letsencrypt.org", Flags: 0, Tag: "issuewild" },
      DOMAIN,
    );
    expect(caa).toMatchObject({ type: "CAA", flags: 0, tag: "issuewild" });
  });
});

describe("toBunny", () => {
  it("sends the numeric type and only the fields the type uses", () => {
    const [cname, , mx, , , caa] = RECORDS.map(toBunny);
    expect(cname).toMatchObject({ Type: 2, Name: "", Value: CDN_HOSTNAME, Disabled: false });
    expect(cname).not.toHaveProperty("Priority");
    expect(mx).toMatchObject({ Type: 4, Value: ".", Priority: 0 });
    expect(caa).toMatchObject({ Type: 9, Flags: 0, Tag: "issue", Value: "letsencrypt.org" });
  });

  it("refuses a type Bunny has no number for", () => {
    expect(() => toBunny({ type: "SPF", name: "", value: "v=spf1 -all" })).toThrow(
      /Unknown record type "SPF"/,
    );
  });
});

describe("planRecords", () => {
  it("is all ok for a zone set from RECORDS", () => {
    expect(plan(goodRecords()).every((s) => s.action === "ok")).toBe(true);
  });

  it("adds an apex record lost in an import", () => {
    const records = goodRecords().filter((r) => !(r.Type === type("CNAME") && r.Name === ""));
    expect(actions(records)).toContain("add CNAME @");
  });

  it("corrects a TXT typed with its quotes in place", () => {
    const records = goodRecords().map((r) =>
      r.Type === type("TXT") && r.Name === "" ? { ...r, Value: '"v=spf1 -all"' } : r,
    );
    const step = plan(records).find((s) => s.action === "update");
    expect(step?.have?.id).toBe(4);
    expect(describeStep(step!)).toContain('(is "\\"v=spf1 -all\\"")');
  });

  it("corrects a matching record that is disabled", () => {
    const records = goodRecords().map((r) => (r.Name === "_dmarc" ? { ...r, Disabled: true } : r));
    expect(actions(records)).toContain("update TXT _dmarc");
  });

  it("deletes a redundant issuewild and a leftover apex A", () => {
    const records = [
      ...goodRecords(),
      { Id: 20, Type: type("CAA"), Name: "", Value: "letsencrypt.org", Flags: 0, Tag: "issuewild" },
      { Id: 21, Type: type("A"), Name: "", Value: "203.0.113.7" },
    ];
    expect(actions(records).filter((a) => a.startsWith("delete"))).toEqual([
      "delete CAA @",
      "delete A @",
    ]);
  });

  it("keeps one of two SPF records and deletes the other", () => {
    const records = [
      ...goodRecords(),
      { Id: 30, Type: type("TXT"), Name: "", Value: "v=spf1 ~all" },
    ];
    expect(actions(records)).toContain("delete TXT @");
    expect(plan(records).find((s) => s.action === "delete")?.have?.id).toBe(30);
  });

  it("never touches NS records or records at other names", () => {
    const records = [
      ...goodRecords(),
      { Id: 40, Type: type("NS"), Name: "", Value: "coco.bunny.net" },
      { Id: 41, Type: type("TXT"), Name: "google", Value: "verification" },
    ];
    const steps = plan(records);
    expect(steps.filter((s) => s.action === "delete")).toEqual([]);
    expect(steps.filter((s) => s.action === "other").map((s) => s.have?.id)).toEqual([40, 41]);
  });
});

describe("dsFromBunny and parseDs", () => {
  it("reads a numeric or named digest type", () => {
    const base = { KeyTag: 2371, Algorithm: 13, Digest: "abcd" };
    expect(dsFromBunny({ ...base, DigestType: "2" })).toEqual({
      keyTag: 2371,
      algorithm: 13,
      digestType: 2,
      digest: "ABCD",
    });
    expect(dsFromBunny({ ...base, DigestType: "SHA-256" }).digestType).toBe(2);
  });

  it("reads the shape Bunny's API sends: integer algorithm, 'SHA256 (2)' digest type", () => {
    expect(
      dsFromBunny({ KeyTag: 2371, Algorithm: 13, DigestType: "SHA256 (2)", Digest: "abcd" }),
    ).toEqual({ keyTag: 2371, algorithm: 13, digestType: 2, digest: "ABCD" });
  });

  it("throws rather than print a DS the registrar cannot use", () => {
    const base = { KeyTag: 2371, Algorithm: 13, DigestType: "2", Digest: "abcd" };
    expect(() => dsFromBunny({ ...base, DigestType: "GOST" })).toThrow(/digest type.*"GOST"/);
    expect(() => dsFromBunny({ ...base, Algorithm: null })).toThrow(/algorithm/);
    expect(() => dsFromBunny({ ...base, Digest: "" })).toThrow(/digest from Bunny/);
  });

  it("parses a DS answer and upper-cases the digest", () => {
    expect(parseDs("2371 13 2 32996839a6d808af")).toEqual({
      keyTag: 2371,
      algorithm: 13,
      digestType: 2,
      digest: "32996839A6D808AF",
    });
  });
});

describe("publicExpectations", () => {
  const expectations = publicExpectations(DOMAIN, "x-probe");
  const byKey = Object.fromEntries(expectations.map((e) => [`${e.name} ${e.type}`, e.expect]));

  it("checks the flattened apex against the addresses of its target", () => {
    const apex = expectations.find((e) => e.name === DOMAIN && e.type === "A");
    expect(apex).toMatchObject({ via: CDN_HOSTNAME, expect: [] });
  });

  it("refuses an apex A next to the apex CNAME, which neither check would cover", () => {
    const wanted = [...RECORDS, { type: "A", name: "", value: "203.0.113.7" }];
    expect(() => publicExpectations(DOMAIN, "x-probe", wanted)).toThrow(/apex A/);
  });

  it("asks the wildcard through a label with no records of its own", () => {
    expect(byKey[`x-probe.${DOMAIN} CNAME`]).toEqual([`${CDN_HOSTNAME}.`]);
  });

  it("writes MX, TXT and CAA the way the resolver answers them", () => {
    expect(byKey[`${DOMAIN} MX`]).toEqual(["0 ."]);
    expect(byKey[`${DOMAIN} TXT`]).toEqual(["v=spf1 -all"]);
    expect(byKey[`_dmarc.${DOMAIN} TXT`]).toEqual(["v=DMARC1; p=reject"]);
    expect(byKey[`${DOMAIN} CAA`]).toEqual(['0 issue "letsencrypt.org"']);
  });
});

/** Google JSON API answers, as recorded from dns.google. */
type DohAnswer = {
  Status?: number;
  AD?: boolean;
  Answer?: { type: number; data: string }[];
  Comment?: string;
};

const T = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, DS: 43, CAA: 257 } as const;
const ZONE_DS = { keyTag: 4242, algorithm: 13, digestType: 2, digest: "ABCDEF" };

function healthyDns(domain = DOMAIN): Record<string, DohAnswer> {
  const ans = (t: number, ...data: string[]) => ({
    Status: 0,
    Answer: data.map((d) => ({ type: t, data: d })),
  });
  return {
    [`${domain} NS`]: ans(T.NS, "kiki.bunny.net.", "coco.bunny.net."),
    [`${domain} A`]: { ...ans(T.A, "158.51.123.205"), AD: true },
    [`${CDN_HOSTNAME} A`]: ans(T.A, "158.51.123.205", "158.51.123.206"),
    [`x-probe.${domain} CNAME`]: ans(T.CNAME, `${CDN_HOSTNAME}.`),
    [`${domain} MX`]: ans(T.MX, "0 ."),
    [`${domain} TXT`]: ans(T.TXT, "v=spf1 -all"),
    [`_dmarc.${domain} TXT`]: ans(T.TXT, "v=DMARC1; p=reject"),
    [`${domain} CAA`]: ans(T.CAA, '0 issue "letsencrypt.org"'),
    [`${domain} DS`]: ans(T.DS, "4242 13 2 abcdef"),
  };
}

/**
 * A fetch that answers DoH queries from `dns` and Bunny calls through `bunny`.
 * A query `dns` has no entry for throws, so a test never passes on a query it
 * did not mean to make. A Response in either place is returned as is.
 */
function fakeFetch(
  dns: Record<string, DohAnswer | Response>,
  bunny?: (method: string, path: string, body: unknown) => unknown,
) {
  return vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(String(input));
    if (url.href.startsWith(DOH_URL)) {
      const key = `${url.searchParams.get("name")} ${url.searchParams.get("type")}`;
      if (!(key in dns)) throw new Error(`unexpected DNS query ${key}`);
      const answer = dns[key];
      return answer instanceof Response ? answer : Response.json(answer);
    }
    if (!bunny) throw new Error(`unexpected request ${url.href}`);
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    const out = bunny(init.method ?? "GET", url.pathname + url.search, body);
    if (out instanceof Response) return out;
    return out === undefined ? new Response(null, { status: 204 }) : Response.json(out);
  }) as unknown as typeof fetch;
}

async function publicFindings(
  dns: Record<string, DohAnswer>,
  ds: typeof ZONE_DS | null = ZONE_DS,
) {
  const findings = await checkPublic(fakeFetch(dns), DOMAIN, { nameservers: NS, ds }, "x-probe");
  return { failed: findings.filter((f) => !f.ok).map((f) => f.line), all: findings };
}

describe("checkPublic", () => {
  it("passes a delegated, signed domain answering every record", async () => {
    const { failed, all } = await publicFindings(healthyDns());
    expect(failed).toEqual([]);
    expect(all.at(-1)?.line).toContain("answers validate");
  });

  it("names the nameservers to set when delegation still points elsewhere", async () => {
    const dns = healthyDns();
    dns[`${DOMAIN} NS`] = { Status: 0, Answer: [{ type: T.NS, data: "maceio.ns.porkbun.com." }] };
    const { failed } = await publicFindings(dns);
    expect(failed).toHaveLength(1);
    expect(failed[0]).toContain("set the registrar's nameservers to coco.bunny.net kiki.bunny.net");
  });

  it("fails an apex with no answer", async () => {
    const dns = healthyDns();
    dns[`${DOMAIN} A`] = { Status: 0, AD: false };
    const { failed } = await publicFindings(dns);
    expect(failed.some((l) => /A\s+@\s+\(no answer\)/.test(l))).toBe(true);
  });

  it("fails an apex that answers with an address the pull zone does not have", async () => {
    const dns = healthyDns();
    dns[`${DOMAIN} A`] = { Status: 0, AD: true, Answer: [{ type: T.A, data: "192.0.2.80" }] };
    const { failed } = await publicFindings(dns);
    expect(failed).toEqual([
      expect.stringContaining(
        `(want an address of ${CDN_HOSTNAME}, which has 158.51.123.205 158.51.123.206)`,
      ),
    ]);
  });

  it("compares CNAME targets without case or trailing dot, as the zone check does", async () => {
    const dns = healthyDns();
    dns[`x-probe.${DOMAIN} CNAME`] = {
      Status: 0,
      Answer: [{ type: T.CNAME, data: CDN_HOSTNAME.toUpperCase() }],
    };
    const { failed } = await publicFindings(dns);
    expect(failed).toEqual([]);
  });

  it("fails an SPF published with literal quotes", async () => {
    const dns = healthyDns();
    dns[`${DOMAIN} TXT`] = { Status: 0, Answer: [{ type: T.TXT, data: '"v=spf1 -all"' }] };
    const { failed } = await publicFindings(dns);
    expect(failed).toHaveLength(1);
    expect(failed[0]).toContain('(want "v=spf1 -all")');
  });

  it("fails an extra CAA record", async () => {
    const dns = healthyDns();
    dns[`${DOMAIN} CAA`].Answer!.push({ type: T.CAA, data: '0 issuewild "letsencrypt.org"' });
    const { failed } = await publicFindings(dns);
    expect(failed).toHaveLength(1);
  });

  it("reports SERVFAIL with the resolver's reason", async () => {
    const dns = healthyDns();
    dns[`${DOMAIN} A`] = { Status: 2, Comment: "DNSSEC validation failure" };
    const { failed } = await publicFindings(dns);
    expect(failed.some((l) => l.includes("SERVFAIL: DNSSEC validation failure"))).toBe(true);
  });

  it("reports a SERVFAIL on NS instead of advising new nameservers", async () => {
    const dns = healthyDns();
    dns[`${DOMAIN} NS`] = { Status: 2 };
    const { failed } = await publicFindings(dns);
    expect(failed).toEqual([expect.stringMatching(/NS\s+SERVFAIL$/)]);
  });

  it("gives no registrar advice when the DS query itself fails", async () => {
    const dns = healthyDns();
    dns[`${DOMAIN} DS`] = { Status: 2, Comment: "upstream timeout" };
    const { failed } = await publicFindings(dns);
    expect(failed).toEqual([
      expect.stringContaining("the DS query got SERVFAIL: upstream timeout; the registry's DS"),
    ]);
    expect(failed[0]).not.toContain("add it at the registrar");
  });

  it("asks for the DS at the registrar when a signed zone has none at the registry", async () => {
    const dns = healthyDns();
    dns[`${DOMAIN} DS`] = { Status: 0 };
    const { failed } = await publicFindings(dns);
    expect(failed).toEqual([
      expect.stringContaining("add it at the registrar: key tag 4242, algorithm 13"),
    ]);
  });

  it("fails a registry DS that does not match the zone", async () => {
    const dns = healthyDns();
    // Same key tag and algorithm, so only the digest tells them apart.
    dns[`${DOMAIN} DS`] = { Status: 0, Answer: [{ type: T.DS, data: "4242 13 2 AE89" }] };
    const { failed } = await publicFindings(dns);
    expect(failed).toEqual([
      expect.stringContaining("does not match the zone; replace it with: key tag 4242"),
    ]);
  });

  it("explains the SERVFAIL a DS for an unsigned zone causes", async () => {
    const { failed } = await publicFindings(healthyDns(), null);
    expect(failed).toEqual([
      expect.stringContaining("the registry has a DS but the zone is unsigned"),
    ]);
  });

  it("fails an unsigned zone without a DS too", async () => {
    const dns = healthyDns();
    dns[`${DOMAIN} DS`] = { Status: 0 };
    const { failed } = await publicFindings(dns, null);
    expect(failed).toEqual([expect.stringContaining("zone unsigned; run set")]);
  });
});

describe("query", () => {
  it("throws on an HTTP error from the resolver", async () => {
    const dns = { [`${DOMAIN} A`]: new Response("busy", { status: 503 }) };
    expect(await rejection(query(fakeFetch(dns), DOMAIN, "A"))).toBe(
      `DNS query ${DOMAIN} A → HTTP 503`,
    );
  });
});

/**
 * Bunny's DNS API over an in-memory account, so set's read-back sees its own
 * writes. Every write is recorded in order.
 */
function fakeBunny(
  zones: { Id: number; Domain: string; Records: BunnyRecord[]; DnsSecEnabled?: boolean }[],
) {
  const writes: string[] = [];
  const calls: string[] = [];
  let nextId = 100;
  const zone = (id: string) => {
    const z = zones.find((x) => x.Id === Number(id));
    if (!z) throw new Error(`no zone ${id}`);
    return z;
  };
  const dsInfo = { KeyTag: 4242, Algorithm: 13, DigestType: "2", Digest: "abcdef" };
  const handler = (method: string, path: string, payload: unknown): unknown => {
    const body = payload as BunnyRecord & { Domain: string };
    let m: RegExpExecArray | null;
    calls.push(`${method} ${path}`);
    if (method === "GET" && path.startsWith("/dnszone?")) {
      return { Items: zones.map(({ Id, Domain }) => ({ Id, Domain })), HasMoreItems: false };
    }
    if (method === "POST" && path === "/dnszone") {
      writes.push(`create ${body.Domain}`);
      const created = { Id: nextId++, Domain: body.Domain, Records: [] };
      zones.push(created);
      return created;
    }
    if (method === "GET" && (m = /^\/dnszone\/(\d+)$/.exec(path))) {
      return { ...zone(m[1]), Nameserver1: NS[0], Nameserver2: NS[1] };
    }
    if (method === "POST" && (m = /^\/dnszone\/(\d+)\/dnssec$/.exec(path))) {
      const z = zone(m[1]);
      if (!z.DnsSecEnabled) writes.push(`dnssec ${z.Domain}`);
      z.DnsSecEnabled = true;
      return dsInfo;
    }
    if (method === "PUT" && (m = /^\/dnszone\/(\d+)\/records$/.exec(path))) {
      writes.push(`add ${RECORD_TYPES[body.Type]} ${body.Name || "@"}`);
      zone(m[1]).Records.push({ ...body, Id: nextId++ });
      return { ...body };
    }
    if ((m = /^\/dnszone\/(\d+)\/records\/(\d+)$/.exec(path))) {
      const [, zoneId, recordId] = m;
      const z = zone(zoneId);
      const i = z.Records.findIndex((r) => r.Id === Number(recordId));
      const r = z.Records[i];
      if (method === "DELETE") {
        writes.push(`delete ${RECORD_TYPES[r.Type]} ${r.Name || "@"}`);
        z.Records.splice(i, 1);
        return undefined;
      }
      if (method === "POST") {
        writes.push(`update ${RECORD_TYPES[r.Type]} ${r.Name || "@"}`);
        z.Records[i] = { ...r, ...body };
        return undefined;
      }
    }
    throw new Error(`unexpected ${method} ${path}`);
  };
  return { handler, writes, calls, zones };
}

async function run(
  argv: string[],
  bunny: ReturnType<typeof fakeBunny>,
  dns: Record<string, DohAnswer | Response> = {},
) {
  const log = vi.fn();
  const error = vi.fn();
  const code = await main(argv, {
    env: { BUNNY_API_KEY: "test-key" },
    fetch: fakeFetch(dns, bunny.handler),
    loadEnv: () => {},
    random: () => "probe",
    log,
    error,
  });
  const lines = (fn: typeof log) => fn.mock.calls.map((c) => String(c[0]));
  return { code, out: lines(log).join("\n"), err: lines(error).join("\n") };
}

describe("main set", () => {
  it("deletes first, then corrects, then adds, reads back and signs the zone", async () => {
    const records = goodRecords()
      .filter((r) => !(r.Type === type("CNAME") && r.Name === ""))
      .map((r) => (r.Type === type("TXT") && r.Name === "" ? { ...r, Value: '"v=spf1 -all"' } : r));
    records.push({ Id: 20, Type: type("A"), Name: "", Value: "203.0.113.7" });
    const bunny = fakeBunny([{ Id: 7, Domain: DOMAIN, Records: records }]);

    const { code, out } = await run(["set", DOMAIN], bunny);

    expect(code).toBe(0);
    expect(bunny.writes).toEqual(["delete A @", "update TXT @", "add CNAME @", `dnssec ${DOMAIN}`]);
    expect(out).toContain("3 change(s) applied, read-back matches");
    expect(out).toContain(
      "Add this DS at the registrar: key tag 4242, algorithm 13, digest type 2",
    );
  });

  it("writes nothing to a zone that already matches and is signed, and prints its DS", async () => {
    const bunny = fakeBunny([
      { Id: 7, Domain: DOMAIN, Records: goodRecords(), DnsSecEnabled: true },
    ]);
    const { code, out } = await run(["set", DOMAIN], bunny);
    expect(code).toBe(0);
    expect(bunny.writes).toEqual([]);
    expect(out).toContain("records already match");
    expect(out).toContain("DNSSEC on. The registrar's DS must be: key tag 4242, algorithm 13");
  });

  it("needs named domains or --all, never both", async () => {
    const bunny = fakeBunny([]);
    expect(await rejection(run(["set"], bunny))).toMatch(/Name the domains to set, or pass --all/);
    expect(await rejection(run(["set", "--all", DOMAIN], bunny))).toMatch(/not both/);
    expect(bunny.calls).toEqual([]);
  });

  it("takes the whole inventory with --all", async () => {
    const { code, err } = await run(["set", "--all"], fakeBunny([]));
    expect(code).toBe(2);
    expect(err).toContain("onetimesecret.co: FAILED — no Bunny DNS zone");
    expect(err).toContain("onetimesecret.io: FAILED — no Bunny DNS zone");
  });

  it("refuses to create a zone without --create, and goes on to the next domain", async () => {
    const bunny = fakeBunny([
      { Id: 7, Domain: "other.example", Records: goodRecords(), DnsSecEnabled: true },
    ]);
    const { code, err, out } = await run(["set", DOMAIN, "other.example"], bunny);
    expect(code).toBe(2);
    expect(err).toContain(`${DOMAIN}: FAILED — no Bunny DNS zone; re-run with --create`);
    expect(out).toContain("1 domain(s) set, 1 failed.");
    expect(bunny.writes).toEqual([]);
  });

  it("creates the zone with --create and fills it", async () => {
    const bunny = fakeBunny([]);
    const { code, out } = await run(["set", "--create", DOMAIN], bunny);
    expect(code).toBe(0);
    expect(bunny.writes[0]).toBe(`create ${DOMAIN}`);
    expect(bunny.writes.filter((w) => w.startsWith("add"))).toHaveLength(RECORDS.length);
    // The new zone's ID comes from the create response, not a second listing.
    expect(bunny.calls.filter((c) => c.startsWith("GET /dnszone?"))).toHaveLength(1);
    expect(out).toContain(`${DOMAIN}  created zone 100`);
    expect(out).not.toContain(`${DOMAIN}  zone 100`);
  });

  it("finds a created zone in the list when the response carries no ID", async () => {
    const bunny = fakeBunny([]);
    const original = bunny.handler;
    bunny.handler = (method, path, body) => {
      const out = original(method, path, body);
      return method === "POST" && path === "/dnszone" ? {} : out;
    };
    const { code, out } = await run(["set", "--create", DOMAIN], bunny);
    expect(code).toBe(0);
    expect(bunny.calls.filter((c) => c.startsWith("GET /dnszone?"))).toHaveLength(2);
    expect(out).toContain(`${DOMAIN}  created zone 100`);
  });

  it("fails when the read-back does not match", async () => {
    const bunny = fakeBunny([{ Id: 7, Domain: DOMAIN, Records: [], DnsSecEnabled: true }]);
    const original = bunny.handler;
    // An API that accepts every add and stores nothing.
    bunny.handler = (method, path, body) => (method === "PUT" ? {} : original(method, path, body));
    const { code, err } = await run(["set", DOMAIN], bunny);
    expect(code).toBe(2);
    expect(err).toContain("read-back still differs");
  });
});

describe("main check", () => {
  it("exits 0 when zone and public answers match", async () => {
    const bunny = fakeBunny([
      { Id: 7, Domain: DOMAIN, Records: goodRecords(), DnsSecEnabled: true },
    ]);
    const { code, out } = await run(["check", DOMAIN], bunny, healthyDns());
    expect(code).toBe(0);
    expect(out).toContain("All domains match.");
    expect(bunny.writes).toEqual([]);
  });

  it("exits 1 on zone drift and writes nothing", async () => {
    const records = [
      ...goodRecords(),
      { Id: 20, Type: type("CAA"), Name: "", Value: "letsencrypt.org", Flags: 0, Tag: "issuewild" },
    ];
    const bunny = fakeBunny([{ Id: 7, Domain: DOMAIN, Records: records, DnsSecEnabled: true }]);
    const { code, out } = await run(["check", DOMAIN], bunny, healthyDns());
    expect(code).toBe(1);
    expect(out).toMatch(/zone\s+extra\s+CAA\s+@\s+0 issuewild "letsencrypt.org"/);
    expect(bunny.writes).toEqual([]);
  });

  it("never enables DNSSEC on an unsigned zone", async () => {
    const bunny = fakeBunny([{ Id: 7, Domain: DOMAIN, Records: goodRecords() }]);
    const { code, out } = await run(["check", DOMAIN], bunny, healthyDns());
    expect(code).toBe(1);
    expect(out).toContain("dnssec off");
    expect(bunny.writes).toEqual([]);
    expect(bunny.calls.filter((c) => !c.startsWith("GET"))).toEqual([]);
  });

  it("reads a signed zone's DS with exactly one DNSSEC POST and nothing else", async () => {
    const bunny = fakeBunny([
      { Id: 7, Domain: DOMAIN, Records: goodRecords(), DnsSecEnabled: true },
    ]);
    const { code } = await run(["check", DOMAIN], bunny, healthyDns());
    expect(code).toBe(0);
    expect(bunny.calls.filter((c) => !c.startsWith("GET"))).toEqual(["POST /dnszone/7/dnssec"]);
  });

  it("sums the problems of every domain", async () => {
    const other = "other.example";
    const bunny = fakeBunny([
      { Id: 7, Domain: DOMAIN, Records: goodRecords() },
      { Id: 8, Domain: other, Records: goodRecords(), DnsSecEnabled: true },
    ]);
    const dns = { ...healthyDns(), ...healthyDns(other) };
    dns[`${other} TXT`] = { Status: 0, Answer: [{ type: T.TXT, data: '"v=spf1 -all"' }] };
    const { code, out } = await run(["check", DOMAIN, other], bunny, dns);
    expect(code).toBe(1);
    // DOMAIN: unsigned zone with a DS at the registry; other: SPF with quotes.
    expect(out).toContain("2 problem(s).");
  });

  it("reports a domain whose check errors and goes on to the next", async () => {
    const other = "other.example";
    const bunny = fakeBunny([
      { Id: 7, Domain: DOMAIN, Records: goodRecords(), DnsSecEnabled: true },
      { Id: 8, Domain: other, Records: goodRecords(), DnsSecEnabled: true },
    ]);
    const original = bunny.handler;
    bunny.handler = (method, path, body) =>
      path === "/dnszone/7" ? new Response("oops", { status: 500 }) : original(method, path, body);
    const { code, out, err } = await run(["check", DOMAIN, other], bunny, healthyDns(other));
    expect(code).toBe(1);
    expect(err).toContain(`${DOMAIN}: CHECK FAILED — GET /dnszone/7 → HTTP 500: oops`);
    expect(out).toContain(`${other}  zone 8`);
    expect(out).toContain("1 problem(s).");
  });

  it("reports a resolver outage as a failed check, not a crash", async () => {
    const bunny = fakeBunny([
      { Id: 7, Domain: DOMAIN, Records: goodRecords(), DnsSecEnabled: true },
    ]);
    const dns = { ...healthyDns(), [`${DOMAIN} MX`]: new Response("", { status: 503 }) };
    const { code, out, err } = await run(["check", DOMAIN], bunny, dns);
    expect(code).toBe(1);
    expect(err).toContain(`${DOMAIN}: CHECK FAILED — DNS query ${DOMAIN} MX → HTTP 503`);
    expect(out).toContain("1 problem(s).");
  });

  it("points a missing zone at set --create", async () => {
    const { code, out } = await run(["check", DOMAIN], fakeBunny([]));
    expect(code).toBe(1);
    expect(out).toContain(`run: pnpm lookalike:dns:set ${DOMAIN} --create`);
  });
});

describe("main arguments", () => {
  const deps = { env: { BUNNY_API_KEY: "k" }, loadEnv: () => {}, log: () => {} };

  it("rejects --create on check", async () => {
    expect(await rejection(main(["check", "--create", DOMAIN], deps))).toMatch(
      /--create is for set only/,
    );
  });

  it("rejects an unknown command or option", async () => {
    expect(await rejection(main(["push"], deps))).toMatch(/Unknown command "push"/);
    expect(await rejection(main(["set", "--force"], deps))).toMatch(/Unknown option\(s\): --force/);
  });

  it("fails without an API key", async () => {
    expect(await rejection(main(["check", DOMAIN], { ...deps, env: {} }))).toMatch(
      /BUNNY_API_KEY is not set/,
    );
  });
});

describe("lookalike-dns.mjs under plain node", () => {
  it("loads and runs --help", () => {
    const out = execFileSync(process.execPath, [SCRIPT, "--help"], { encoding: "utf8" });
    expect(out).toMatch(/^Usage: pnpm lookalike:dns:<check\|set>/);
    for (const c of COMMANDS) expect(out).toMatch(new RegExp(`^  ${c} `, "m"));
  });

  it("names a pnpm script for each command", () => {
    const pkg = JSON.parse(readFileSync(resolve(SCRIPT, "../../package.json"), "utf8"));
    for (const c of COMMANDS) {
      expect(pkg.scripts[`lookalike:dns:${c}`]).toBe(`node scripts/lookalike-dns.mjs ${c}`);
    }
  });
});
