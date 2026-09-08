/**
 * @file errorPageCli.test.ts
 * @description Unit tests for edge/error-page/cli.mjs: which pull zones a
 * region resolves to, when a zone counts as out of date, how the zone list is
 * parsed, and what the push, verify and deploy commands decide to write. The
 * HTTP layer is exercised through an injected fetch so no test reaches the
 * Bunny API.
 *
 * The failure modes worth pinning are the ones that would write to the wrong
 * zone, skip a zone that needed the push, or work from a partial zone list: a
 * hostname on two zones, a region with no zone at all, a zone whose page
 * matches but is disabled, a paginated response with more pages, and a zone
 * named for one region that is really another region's zone.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  COMMANDS,
  EXPECTED_CHANGES,
  REGIONAL_HOSTS,
  envZoneRefs,
  loadDotenv,
  main,
  pageMarker,
  probeRegion,
  servingCheck,
  normalize,
  parsePullZoneList,
  parseRegionArgs,
  pickRegions,
  planZone,
  selectRegionalZones,
  unexpectedChanges,
  zoneEnvVar,
} from "../../../edge/error-page/cli.mjs";
import { jurisdictions } from "../../../src/data/ops/jurisdictions";

const PAGE = "<html>\n<body>\n{{status_code}}\n</body>\n</html>";
const SCRIPT = resolve(import.meta.dirname, "../../../edge/error-page/cli.mjs");
const TEMPLATE = resolve(import.meta.dirname, "../../../edge/error-page/regional.html");

type FakeZone = Record<string, unknown> & {
  Id: number;
  Name: string;
  Hostnames: { Value: string }[];
};

function zone(id: number, hosts: string[], extra: Record<string, unknown> = {}): FakeZone {
  return {
    Id: id,
    Name: `zone-${id}`,
    Hostnames: hosts.map((Value) => ({ Value })),
    ...extra,
  };
}

describe("REGIONAL_HOSTS", () => {
  it("is the live jurisdictions' domains, keyed by lower-case identifier", () => {
    expect(REGIONAL_HOSTS).toEqual({
      eu: "eu.onetimesecret.com",
      ca: "ca.onetimesecret.com",
      nz: "nz.onetimesecret.com",
      us: "us.onetimesecret.com",
      uk: "uk.onetimesecret.com",
    });
    for (const [region, host] of Object.entries(REGIONAL_HOSTS)) {
      const j = jurisdictions.find((x) => x.identifier.toLowerCase() === region);
      expect(j?.domain).toBe(host);
      expect(j?.comingSoon).toBeFalsy();
    }
  });

  it("excludes comingSoon regions, which have no pull zone yet", () => {
    const comingSoon = jurisdictions.filter((j) => j.comingSoon);

    expect(comingSoon.length).toBeGreaterThan(0);
    for (const j of comingSoon) {
      expect(REGIONAL_HOSTS).not.toHaveProperty(j.identifier.toLowerCase());
    }
  });
});

describe("selectRegionalZones", () => {
  it("resolves every region to the zone carrying its hostname", () => {
    const zones = [
      zone(1, ["onetimesecret.com", "www.onetimesecret.com"]),
      zone(2, ["eu.onetimesecret.com", "eu-b-cdn.example"]),
      zone(3, ["UK.onetimesecret.com"]),
    ];
    const hosts = { eu: REGIONAL_HOSTS.eu, uk: REGIONAL_HOSTS.uk };

    const selected = selectRegionalZones(zones, hosts);

    expect(selected.map((s) => [s.region, s.zone.Id])).toEqual([
      ["eu", 2],
      ["uk", 3],
    ]);
  });

  it("fails loudly when a region has no zone, and says how to name one", () => {
    const zones = [zone(2, ["eu.onetimesecret.com"])];

    const attempt = () =>
      selectRegionalZones(zones, { eu: REGIONAL_HOSTS.eu, ca: REGIONAL_HOSTS.ca });

    expect(attempt).toThrow(/ca\.onetimesecret\.com/);
    expect(attempt).toThrow(/BUNNY_PULL_ZONE_CA=/);
    expect(attempt).toThrow(/ ca=<zone name or ID>/);
  });

  describe("with a zone named for a region", () => {
    // A shield zone: generated name, only the b-cdn hostname, no public one.
    const shield = { ...zone(7, ["x9k2m4p1.b-cdn.net"]), Name: "x9k2m4p1" };
    const zones = [zone(2, ["eu.onetimesecret.com"]), shield];

    it("resolves the region to the zone by name, case-insensitively", () => {
      const selected = selectRegionalZones(zones, { nz: REGIONAL_HOSTS.nz }, { nz: "X9K2M4P1" });

      expect(selected).toEqual([{ region: "nz", host: REGIONAL_HOSTS.nz, zone: shield }]);
    });

    it("resolves the region to the zone by numeric ID", () => {
      const selected = selectRegionalZones(zones, { nz: REGIONAL_HOSTS.nz }, { nz: "7" });

      expect(selected.map((s) => s.zone.Id)).toEqual([7]);
    });

    it("still finds unnamed regions by hostname", () => {
      const hosts = { eu: REGIONAL_HOSTS.eu, nz: REGIONAL_HOSTS.nz };

      const selected = selectRegionalZones(zones, hosts, { nz: "x9k2m4p1" });

      expect(selected.map((s) => [s.region, s.zone.Id])).toEqual([["eu", 2], ["nz", 7]]);
    });

    it("fails when no zone has that name or ID", () => {
      expect(() => selectRegionalZones(zones, { nz: REGIONAL_HOSTS.nz }, { nz: "nope" }))
        .toThrow(/No pull zone named or numbered "nope" \(given for nz\)/);
      expect(() => selectRegionalZones(zones, { nz: REGIONAL_HOSTS.nz }, { nz: "99" }))
        .toThrow(/"99"/);
    });

    it("refuses a zone that carries another region's hostname", () => {
      expect(() => selectRegionalZones(zones, { nz: REGIONAL_HOSTS.nz }, { nz: "zone-2" }))
        .toThrow(/carries eu\.onetimesecret\.com, the eu hostname/);
    });

    it("accepts a zone that carries its own region's hostname", () => {
      const selected = selectRegionalZones(zones, { eu: REGIONAL_HOSTS.eu }, { eu: "2" });

      expect(selected.map((s) => s.zone.Id)).toEqual([2]);
    });
  });

  it("refuses a hostname attached to two zones", () => {
    const zones = [zone(2, ["eu.onetimesecret.com"]), zone(9, ["eu.onetimesecret.com"])];

    expect(() => selectRegionalZones(zones, { eu: REGIONAL_HOSTS.eu })).toThrow(/two pull zones/);
  });

  it("never selects the marketing zone", () => {
    const zones = [zone(1, ["onetimesecret.com"]), ...Object.values(REGIONAL_HOSTS).map(
      (host, i) => zone(10 + i, [host]),
    )];

    const ids = selectRegionalZones(zones).map((s) => s.zone.Id);

    expect(ids).not.toContain(1);
    expect(ids).toHaveLength(Object.keys(REGIONAL_HOSTS).length);
  });
});

describe("planZone", () => {
  const selected = (extra: Record<string, unknown>) => ({
    region: "eu",
    host: REGIONAL_HOSTS.eu,
    zone: zone(2, [REGIONAL_HOSTS.eu], extra),
  });

  it("is up to date when enabled and the page matches", () => {
    const plan = planZone(
      selected({ ErrorPageEnableCustomCode: true, ErrorPageCustomCode: PAGE }),
      PAGE,
    );

    expect(plan.action).toBe("up-to-date");
  });

  it("ignores CRLF line endings and surrounding whitespace", () => {
    const crlf = PAGE.replaceAll("\n", "\r\n");
    expect(crlf).not.toBe(PAGE); // the fixture really has internal line breaks

    const plan = planZone(
      selected({ ErrorPageEnableCustomCode: true, ErrorPageCustomCode: `\r\n${crlf}\r\n` }),
      `${PAGE}\n`,
    );

    expect(plan.action).toBe("up-to-date");
  });

  it("updates a zone whose page matches but is disabled", () => {
    const plan = planZone(
      selected({ ErrorPageEnableCustomCode: false, ErrorPageCustomCode: PAGE }),
      PAGE,
    );

    expect([plan.action, plan.reason]).toEqual(["update", "custom error page disabled"]);
  });

  it("updates a zone with no page at all", () => {
    const plan = planZone(selected({ ErrorPageEnableCustomCode: true }), PAGE);

    expect([plan.action, plan.reason]).toEqual(["update", "page content differs"]);
  });

  it("updates a zone whose page differs", () => {
    const plan = planZone(
      selected({ ErrorPageEnableCustomCode: true, ErrorPageCustomCode: "<html>old</html>" }),
      PAGE,
    );

    expect([plan.action, plan.id, plan.host]).toEqual(["update", 2, REGIONAL_HOSTS.eu]);
  });
});

describe("zoneEnvVar", () => {
  it("upper-cases the region into the variable name", () => {
    expect(zoneEnvVar("nz")).toBe("BUNNY_PULL_ZONE_NZ");
  });
});

describe("envZoneRefs", () => {
  it("collects one reference per region that has a non-empty variable", () => {
    const env = {
      BUNNY_PULL_ZONE_NZ: " x9k2m4p1 ",
      BUNNY_PULL_ZONE_UK: "",
      BUNNY_PULL_ZONE_BR: "not-live",
      BUNNY_API_KEY: "k",
    };

    expect(envZoneRefs(env)).toEqual({ nz: "x9k2m4p1" });
  });

  it("only reads the regions asked for", () => {
    const env = { BUNNY_PULL_ZONE_NZ: "a", BUNNY_PULL_ZONE_EU: "b" };

    expect(envZoneRefs(env, { eu: REGIONAL_HOSTS.eu })).toEqual({ eu: "b" });
  });
});

describe("parseRegionArgs", () => {
  it("separates plain regions from region=zone overrides", () => {
    expect(parseRegionArgs(["EU", "nz=X9k2", "ca=123"])).toEqual({
      regions: ["eu", "nz", "ca"],
      refs: { nz: "X9k2", ca: "123" },
    });
  });

  it("keeps the zone name's case and allows '=' inside it", () => {
    expect(parseRegionArgs(["nz=a=b"]).refs).toEqual({ nz: "a=b" });
  });

  it.each(["nz=", "=zone", "="])("rejects %j", (arg) => {
    expect(() => parseRegionArgs([arg])).toThrow(/Malformed argument/);
  });

  it("is empty for no arguments", () => {
    expect(parseRegionArgs([])).toEqual({ regions: [], refs: {} });
  });
});

describe("pickRegions", () => {
  it("returns every region when none are named", () => {
    expect(pickRegions([])).toEqual(REGIONAL_HOSTS);
  });

  it("narrows to the named regions in the order given", () => {
    expect(Object.keys(pickRegions(["uk", "eu"]))).toEqual(["uk", "eu"]);
  });

  it("accepts region codes in any case", () => {
    expect(pickRegions(["EU", "Uk"])).toEqual({ eu: REGIONAL_HOSTS.eu, uk: REGIONAL_HOSTS.uk });
  });

  it("rejects a region that has no live zone", () => {
    expect(() => pickRegions(["br"])).toThrow(/Unknown region\(s\): br/);
  });
});

describe("normalize", () => {
  it("treats null as empty", () => {
    expect(normalize(null)).toBe("");
  });

  it("rewrites CRLF to LF and trims the ends", () => {
    expect(normalize("\r\n<a>\r\n<b>\r\n")).toBe("<a>\n<b>");
  });
});

describe("parsePullZoneList", () => {
  const zones = [zone(1, ["a.example"]), zone(2, ["b.example"])];

  it("accepts a bare array", () => {
    expect(parsePullZoneList(zones)).toBe(zones);
  });

  it("accepts a paginated object when there is no further page", () => {
    expect(parsePullZoneList({ Items: zones, HasMoreItems: false })).toBe(zones);
  });

  it("refuses to work from a partial list", () => {
    expect(() => parsePullZoneList({ Items: zones, HasMoreItems: true })).toThrow(/pagination/);
  });

  it.each([null, "zones", 42, {}, { Items: "nope" }])("rejects %j", (data) => {
    expect(() => parsePullZoneList(data)).toThrow(/Unexpected shape/);
  });
});

describe("unexpectedChanges", () => {
  const before = {
    Id: 2,
    OriginUrl: "https://origin",
    Hostnames: [{ Value: "eu.onetimesecret.com" }],
    ErrorPageEnableCustomCode: false,
    ErrorPageCustomCode: null,
    MonthlyBandwidthUsed: 10,
  };

  it("is empty when only the pushed fields and Bunny's counters moved", () => {
    const after = {
      ...before,
      ErrorPageEnableCustomCode: true,
      ErrorPageCustomCode: PAGE,
      MonthlyBandwidthUsed: 11,
    };

    expect(unexpectedChanges(before, after)).toEqual([]);
  });

  it("names every other field that changed, was added, or was dropped", () => {
    const rest = Object.fromEntries(Object.entries(before).filter(([k]) => k !== "OriginUrl"));
    const after = {
      ...rest,
      Hostnames: [],
      ErrorPageEnableCustomCode: true,
      ErrorPageCustomCode: PAGE,
      EnableGeoZoneEU: true,
    };

    expect(unexpectedChanges(before, after)).toEqual([
      "EnableGeoZoneEU",
      "Hostnames",
      "OriginUrl",
    ]);
  });

  it("ignores exactly the fields a push is expected to change", () => {
    expect(EXPECTED_CHANGES).toEqual([
      "ErrorPageEnableCustomCode",
      "ErrorPageCustomCode",
      "MonthlyBandwidthUsed",
      "MonthlyCharges",
    ]);
  });
});

describe("cli.mjs under plain node", () => {
  // Vitest resolves the .ts import through Vite; the script has to load under
  // node's own type stripping too, and the "run when executed directly" guard
  // has to fire. One --help run pins both.
  it("loads and runs --help", () => {
    const out = execFileSync(process.execPath, [SCRIPT, "--help"], { encoding: "utf8" });

    expect(out).toMatch(/^Usage: pnpm edge:error-page:<push\|verify\|deploy\|probe>/);
    expect(out).toContain("BUNNY_PULL_ZONE_<REGION>");
    expect(out).toContain(Object.keys(REGIONAL_HOSTS).join(", "));
    for (const c of COMMANDS) expect(out).toMatch(new RegExp(`^  ${c} `, "m"));
  });

  it("names every pnpm script for its command", () => {
    const pkg = JSON.parse(readFileSync(resolve(SCRIPT, "../../../package.json"), "utf8"));
    for (const c of COMMANDS) {
      expect(pkg.scripts[`edge:error-page:${c}`]).toBe(`node edge/error-page/cli.mjs ${c}`);
    }
  });
});

describe("loadDotenv", () => {
  const KEY = "ERROR_PAGE_PUSH_TEST_VAR";
  let dir: string;

  afterEach(() => {
    delete process.env[KEY];
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  function root(files: Record<string, string>) {
    dir = mkdtempSync(join(tmpdir(), "push-dotenv-"));
    for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
    return dir;
  }

  it("is silent when neither file exists", () => {
    expect(() => loadDotenv(root({}))).not.toThrow();
    expect(process.env[KEY]).toBeUndefined();
  });

  it("lets .env.local override .env, and the environment override both", () => {
    const r = root({ ".env": `${KEY}=from-env\n`, ".env.local": `${KEY}=from-local\n` });

    loadDotenv(r);
    expect(process.env[KEY]).toBe("from-local");

    process.env[KEY] = "from-shell";
    loadDotenv(r);
    expect(process.env[KEY]).toBe("from-shell");
  });
});

describe("regional.html", () => {
  const html = readFileSync(TEMPLATE, "utf8");

  it("keeps both Bunny placeholders", () => {
    expect(html).toContain("{{status_code}}");
    expect(html).toContain("{{status_title}}");
  });

  it("only animates for visitors without a reduced-motion preference", () => {
    const gated = html.match(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n {6}\}/);
    expect(gated).not.toBeNull();
    const outside = html.replace(gated![0], "");
    expect(outside).not.toMatch(/animation:/);
  });

  it("links and fonts are absolute, never relative to the failing origin", () => {
    for (const m of html.matchAll(/(?:href=|url\()["']([^"']+)["']/g)) {
      expect(m[1]).toMatch(/^https:\/\/(status\.)?onetimesecret\.com\//);
    }
    expect(html).not.toContain('href="/');
  });
});

describe("servingCheck", () => {
  const plan = (region: string, id: number, name: string) => ({
    region,
    host: `${region}.onetimesecret.com`,
    id,
    name,
    action: "up-to-date" as const,
    reason: "",
  });
  const plans = [plan("nz", 6421160, "be2169e1-7"), plan("eu", 11, "zone-11")];

  it("names the probe for the regions just handled", () => {
    const text = servingCheck(plans);

    expect(text).toContain("pnpm edge:error-page:probe nz eu");
    expect(text).not.toContain("ZONE=");
    expect(text).not.toContain("api.bunny.net");
  });

  it("says when the page is served and where the by-hand checks live", () => {
    const text = servingCheck(plans);

    expect(text).toMatch(/500 from the app passes through/);
    expect(text).toContain('edge/README.md, "Regional error page"');
  });
});

describe("pageMarker", () => {
  it("is the template's title element", () => {
    expect(pageMarker("<html><title>Onetime Secret - Service Error</title></html>")).toBe(
      "<title>Onetime Secret - Service Error</title>",
    );
  });

  it("refuses a template without one", () => {
    expect(() => pageMarker("<html></html>")).toThrow(/no <title>/);
  });
});

describe("probeRegion", () => {
  const marker = "<title>Onetime Secret - Service Error</title>";
  const bunny = { "CDN-PullZone": "6421160", "CDN-Cache": "MISS" };
  const page = (status: number, body: string, headers: Record<string, string> = bunny) =>
    vi.fn(async () => new Response(body, { status, headers })) as unknown as typeof fetch;
  const probe = (f: typeof fetch) => probeRegion(f, "nz", "nz.onetimesecret.com", marker);

  it("reports the pull zone Bunny answered from", async () => {
    const p = await probe(page(502, `<html>${marker}</html>`));

    expect(p).toMatchObject({ outcome: "served", zone: "6421160", detail: /via pull zone 6421160/ });
  });

  it("calls an answer without Bunny's headers a hostname that bypasses the zone", async () => {
    const p = await probe(page(200, "<html>app</html>", {}));

    expect(p).toMatchObject({ outcome: "direct", detail: /does not route through the zone/ });
  });

  it("reports the custom page on a 5xx carrying the title with placeholders filled", async () => {
    // The template's hide script and comment say "{{" themselves; only a
    // surviving placeholder token counts as unfilled.
    const body = `<html>${marker}<div>502</div><script>if (t.includes("{{")) {}</script></html>`;
    const p = await probe(page(502, body));

    expect(p).toMatchObject({ status: 502, outcome: "served" });
  });

  it("fetches the public URL once, without following redirects", async () => {
    const f = page(200, "<html><title>Onetime Secret</title></html>");
    await probe(f);

    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = (f as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    expect(url).toBe("https://nz.onetimesecret.com/");
    expect(init.redirect).toBe("manual");
  });

  it("calls a 2xx or 3xx the origin answering, whatever the body says", async () => {
    // The app's own homepage also says "Onetime Secret"; that must not count.
    expect(await probe(page(200, `<html>${marker}</html>`))).toMatchObject({ outcome: "origin" });
    expect(await probe(page(302, ""))).toMatchObject({ status: 302, outcome: "origin" });
    expect((await probe(page(200, "app"))).detail).toMatch(/cache MISS/);
  });

  it("distinguishes a 5xx that is not the page from one with an unfilled placeholder", async () => {
    expect(await probe(page(503, "<html>Bunny default</html>"))).toMatchObject({ outcome: "other" });
    expect(await probe(page(502, `${marker}{{status_code}}`))).toMatchObject({ outcome: "unfilled" });
  });

  it("turns a failed request into an outcome rather than throwing", async () => {
    const f = vi.fn(async () => {
      throw new Error("ECONNRESET");
    }) as unknown as typeof fetch;

    expect(await probe(f)).toMatchObject({ status: 0, outcome: "error", detail: /ECONNRESET/ });
  });
});

describe("main", () => {
  const template = normalize(
    readFileSync(resolve(import.meta.dirname, "../../../edge/error-page/regional.html"), "utf8"),
  );

  /** In-memory Bunny: a zone list plus a store the POSTs write into. */
  function fakeBunny(
    zones: FakeZone[],
    opts: { failIds?: number[]; sideEffect?: Record<string, unknown> } = {},
  ) {
    const store = new Map(zones.map((z) => [z.Id, { ...z }]));
    const posts: { id: number; body: Record<string, unknown> }[] = [];
    const fetch = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
      const path = new URL(String(input)).pathname;
      const json = (status: number, body: unknown) =>
        new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
      if (path === "/pullzone") return json(200, [...store.values()]);
      const id = Number(path.split("/").pop());
      if (init.method === "POST") {
        if (opts.failIds?.includes(id)) return new Response("boom", { status: 500 });
        const body = JSON.parse(String(init.body)) as Record<string, unknown>;
        posts.push({ id, body });
        // `sideEffect` simulates an API that resets unrelated fields on update.
        store.set(id, { ...store.get(id)!, ...body, ...opts.sideEffect });
        return json(200, store.get(id));
      }
      return json(200, store.get(id));
    });
    return { fetch, posts, store };
  }

  function run(argv: string[], fetch: unknown, env = { BUNNY_API_KEY: "k" }) {
    const log = vi.fn();
    const error = vi.fn();
    const loadEnv = vi.fn();
    const code = main(argv, { env, fetch: fetch as typeof globalThis.fetch, loadEnv, log, error });
    return { code, log, error, loadEnv };
  }

  /** The rejection message of a promise, or "resolved" when it did not reject. */
  const rejection = (p: Promise<unknown>) =>
    p.then(
      () => "resolved",
      (err: unknown) => (err instanceof Error ? err.message : String(err)),
    );

  const liveZones = () =>
    Object.values(REGIONAL_HOSTS).map((host, i) =>
      zone(10 + i, [host], { ErrorPageEnableCustomCode: true, ErrorPageCustomCode: template }),
    );

  it("prints usage and exits 0 on --help without touching the network", async () => {
    const { fetch } = fakeBunny([]);
    const { code, log, loadEnv } = run(["push", "--help"], fetch);

    expect(await code).toBe(0);
    expect(log.mock.calls[0][0]).toMatch(/^Usage:/);
    expect(fetch).not.toHaveBeenCalled();
    expect(loadEnv).not.toHaveBeenCalled();
  });

  it("rejects an unknown flag before doing anything", async () => {
    const { fetch } = fakeBunny([]);
    const { code } = run(["push", "--force"], fetch);

    expect(await rejection(code)).toMatch(/Unknown option\(s\): --force/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fails without BUNNY_API_KEY", async () => {
    const { fetch } = fakeBunny([]);
    const { code, loadEnv } = run(["push"], fetch, {} as { BUNNY_API_KEY: string });

    expect(await rejection(code)).toMatch(/BUNNY_API_KEY is not set/);
    expect(loadEnv).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends the API key on every request", async () => {
    const { fetch } = fakeBunny(liveZones());
    await run(["push"], fetch, { BUNNY_API_KEY: "secret" }).code;

    for (const [, init] of fetch.mock.calls) {
      expect((init as RequestInit).headers).toEqual(expect.objectContaining({ AccessKey: "secret" }));
      expect((init as RequestInit).signal instanceof AbortSignal).toBe(true);
    }
  });

  it("exits 0 and writes nothing when every zone matches", async () => {
    const { fetch, posts } = fakeBunny(liveZones());
    const { code, log } = run(["push"], fetch);

    expect(await code).toBe(0);
    expect(posts).toEqual([]);
    expect(log).toHaveBeenCalledWith("All zones match regional.html.");
  });

  it("reports drift with exit 1 and writes nothing without --apply", async () => {
    const zones = liveZones();
    zones[1].ErrorPageCustomCode = "<html>old</html>";
    const { fetch, posts } = fakeBunny(zones);
    const { code, log } = run(["push"], fetch);

    expect(await code).toBe(1);
    expect(posts).toEqual([]);
    expect(log).toHaveBeenCalledWith("1 zone(s) differ. Re-run with --apply to push.");
  });

  it("pushes only the drifted zones with --apply, then verifies", async () => {
    const zones = liveZones();
    zones[0].ErrorPageEnableCustomCode = false;
    zones[3].ErrorPageCustomCode = "<html>old</html>";
    const { fetch, posts } = fakeBunny(zones);
    const { code, log } = run(["push", "--apply"], fetch);

    expect(await code).toBe(0);
    expect(posts.map((p) => p.id)).toEqual([zones[0].Id, zones[3].Id]);
    for (const { body } of posts) {
      expect(body).toEqual({ ErrorPageEnableCustomCode: true, ErrorPageCustomCode: template });
    }
    expect(log).toHaveBeenCalledWith("2 zone(s) pushed, 0 failed.");
  });

  it("limits the push to the named regions, case-insensitively", async () => {
    const zones = liveZones();
    for (const z of zones) z.ErrorPageEnableCustomCode = false;
    const { fetch, posts } = fakeBunny(zones);
    const { code } = run(["push", "--apply", "UK"], fetch);

    expect(await code).toBe(0);
    expect(posts.map((p) => p.id)).toEqual([zones[Object.keys(REGIONAL_HOSTS).indexOf("uk")].Id]);
  });

  it("pushes to the zone named in the environment when it lacks the hostname", async () => {
    const zones = liveZones();
    const nz = zones[Object.keys(REGIONAL_HOSTS).indexOf("nz")];
    nz.Name = "x9k2m4p1";
    nz.Hostnames = [{ Value: "x9k2m4p1.b-cdn.net" }];
    nz.ErrorPageEnableCustomCode = false;
    const { fetch, posts } = fakeBunny(zones);

    const without = run(["push", "--apply"], fetch);
    expect(await rejection(without.code)).toMatch(/nz\.onetimesecret\.com.*BUNNY_PULL_ZONE_NZ/);
    expect(posts).toEqual([]);

    const env = { BUNNY_API_KEY: "k", BUNNY_PULL_ZONE_NZ: "x9k2m4p1" };
    const { code } = run(["push", "--apply"], fetch, env);
    expect(await code).toBe(0);
    expect(posts.map((p) => p.id)).toEqual([nz.Id]);
  });

  it("lets a region=zone argument override the environment", async () => {
    const zones = liveZones();
    const nz = zones[Object.keys(REGIONAL_HOSTS).indexOf("nz")];
    nz.Hostnames = [{ Value: "x9k2m4p1.b-cdn.net" }];
    nz.ErrorPageEnableCustomCode = false;
    const { fetch, posts } = fakeBunny(zones);
    const env = { BUNNY_API_KEY: "k", BUNNY_PULL_ZONE_NZ: "stale-name" };

    const { code } = run(["push", "--apply", `nz=${nz.Id}`], fetch, env);

    expect(await code).toBe(0);
    expect(posts.map((p) => p.id)).toEqual([nz.Id]);
  });

  it("refuses a named zone that is another region's zone, before writing", async () => {
    const zones = liveZones();
    for (const z of zones) z.ErrorPageEnableCustomCode = false;
    const eu = zones[Object.keys(REGIONAL_HOSTS).indexOf("eu")];
    const { fetch, posts } = fakeBunny(zones);

    const { code } = run(["push", "--apply", `nz=${eu.Name}`], fetch);

    expect(await rejection(code)).toMatch(/the eu hostname/);
    expect(posts).toEqual([]);
  });

  it("rejects a missing or unknown command before doing anything", async () => {
    const { fetch } = fakeBunny([]);

    expect(await rejection(run([], fetch).code)).toMatch(/Unknown command ""/);
    expect(await rejection(run(["sync"], fetch).code)).toMatch(/Unknown command "sync"/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["verify", "deploy", "probe"])("rejects --apply for %s", async (command) => {
    const { fetch } = fakeBunny([]);

    const message = await rejection(run([command, "--apply"], fetch).code);

    expect(message).toMatch(/--apply is for push only/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps going after a failed zone and exits 2", async () => {
    const zones = liveZones();
    for (const z of zones) z.ErrorPageEnableCustomCode = false;
    const { fetch, posts } = fakeBunny(zones, { failIds: [zones[1].Id] });
    const { code, log, error } = run(["push", "--apply"], fetch);

    expect(await code).toBe(2);
    expect(posts).toHaveLength(zones.length - 1);
    expect(error).toHaveBeenCalledWith(expect.stringMatching(/FAILED — POST .* HTTP 500: boom/));
    expect(log).toHaveBeenCalledWith(`${zones.length - 1} zone(s) pushed, 1 failed.`);
  });

  it("fails a zone whose update changed a field it did not send", async () => {
    const zones = liveZones();
    zones[0].ErrorPageEnableCustomCode = false;
    zones[0].OriginUrl = "https://origin";
    const { fetch, store } = fakeBunny(zones, { sideEffect: { OriginUrl: null } });
    const { code, error } = run(["push", "--apply"], fetch);

    expect(await code).toBe(2);
    expect(error).toHaveBeenCalledWith(expect.stringMatching(/also changed OriginUrl/));
    // The page itself did land; the exit code is about the collateral change.
    expect(store.get(zones[0].Id)?.ErrorPageCustomCode).toBe(template);
  });

  describe("verify", () => {
    it("exits 0, writes nothing, and ends with the summary after the serving check", async () => {
      const zones = liveZones();
      const { fetch, posts } = fakeBunny(zones);
      const { code, log } = run(["verify"], fetch);

      expect(await code).toBe(0);
      expect(posts).toEqual([]);
      expect(log).toHaveBeenCalledWith("All zones verified.");
      const lines = log.mock.calls.map((c) => String(c[0]));
      expect(lines.filter((l) => / {2}OK\n {4}origin/.test(l))).toHaveLength(zones.length);
      expect(lines.at(-1)).toBe("All zones verified.");
      expect(lines.at(-2)).toContain(
        `pnpm edge:error-page:probe ${Object.keys(REGIONAL_HOSTS).join(" ")}`,
      );
    });

    it("exits 1 and names the failing zones, still without writing", async () => {
      const zones = liveZones();
      zones[0].ErrorPageEnableCustomCode = false;
      zones[2].ErrorPageCustomCode = "<html>old</html>";
      const { fetch, posts } = fakeBunny(zones);
      const { code, log } = run(["verify"], fetch);

      expect(await code).toBe(1);
      expect(posts).toEqual([]);
      const lines = log.mock.calls.map((c) => String(c[0]));
      const failing = (id: number) => lines.find((l) => l.includes(`zone ${id} `)) ?? "";
      expect(failing(zones[0].Id)).toContain("FAIL (custom error page disabled)");
      expect(failing(zones[2].Id)).toContain("FAIL (page content differs)");
      expect(log).toHaveBeenCalledWith("2 zone(s) failed verification.");
    });

    it("reads each zone fresh and shows its origin and hostnames", async () => {
      const zones = liveZones();
      zones[1].OriginUrl = "https://ca-origin.example";
      const { fetch } = fakeBunny(zones);
      const { code, log } = run(["verify", "ca"], fetch);
      expect(await code).toBe(0);

      const lines = log.mock.calls.map((c) => String(c[0]));
      expect(lines[0]).toContain(
        "origin https://ca-origin.example; hostnames ca.onetimesecret.com",
      );
      const gets = fetch.mock.calls.map(([u]) => new URL(String(u)).pathname);
      expect(gets).toEqual(["/pullzone", `/pullzone/${zones[1].Id}`]);
    });

    it("honours a region=zone override like push does", async () => {
      const zones = liveZones();
      const nz = zones[Object.keys(REGIONAL_HOSTS).indexOf("nz")];
      nz.Hostnames = [{ Value: "x9k2m4p1.b-cdn.net" }];
      const { fetch } = fakeBunny(zones);

      expect(await run(["verify", "nz"], fetch).code.then(() => "ok", (e: Error) => e.message))
        .toMatch(/BUNNY_PULL_ZONE_NZ/);
      expect(await run(["verify", `nz=${nz.Id}`], fetch).code).toBe(0);
    });
  });

  describe("deploy", () => {
    it("pushes the drifted zones, verifies every zone, and prints the manual checks", async () => {
      const zones = liveZones();
      zones[0].ErrorPageEnableCustomCode = false;
      zones[3].ErrorPageCustomCode = "<html>old</html>";
      const { fetch, posts } = fakeBunny(zones);
      const { code, log, error } = run(["deploy"], fetch);

      expect(await code).toBe(0);
      expect(posts.map((p) => p.id)).toEqual([zones[0].Id, zones[3].Id]);
      expect(error).not.toHaveBeenCalled();
      const lines = log.mock.calls.map((c) => String(c[0]));
      expect(lines.filter((l) => / {2}OK\n {4}origin/.test(l))).toHaveLength(zones.length);
      expect(lines.filter((l) => l.endsWith(", nothing to push"))).toHaveLength(zones.length - 2);
      expect(lines.at(-1)).toBe(`${zones.length} zone(s) deployed and verified.`);
      expect(lines.at(-2)).toContain("take the origin down");
    });

    it("works one region at a time, in the order given", async () => {
      const zones = liveZones();
      for (const z of zones) z.ErrorPageEnableCustomCode = false;
      const { fetch, posts } = fakeBunny(zones);
      const { code } = run(["deploy", "uk", "eu"], fetch);

      expect(await code).toBe(0);
      const uk = zones[Object.keys(REGIONAL_HOSTS).indexOf("uk")].Id;
      const eu = zones[Object.keys(REGIONAL_HOSTS).indexOf("eu")].Id;
      expect(posts.map((p) => p.id)).toEqual([uk, eu]);
      // Every request for uk precedes every request for eu: no interleaving.
      const paths = fetch.mock.calls.map(([u]) => new URL(String(u)).pathname).slice(1);
      const lastUk = paths.lastIndexOf(`/pullzone/${uk}`);
      const firstEu = paths.indexOf(`/pullzone/${eu}`);
      expect(lastUk).toBeLessThan(firstEu);
    });

    it("stops at the first failure and leaves the remaining zones untouched", async () => {
      const zones = liveZones();
      for (const z of zones) z.ErrorPageEnableCustomCode = false;
      const { fetch, posts } = fakeBunny(zones, { failIds: [zones[1].Id] });
      const { code, log, error } = run(["deploy"], fetch);

      expect(await code).toBe(2);
      expect(posts.map((p) => p.id)).toEqual([zones[0].Id]);
      expect(error).toHaveBeenCalledWith(expect.stringMatching(/FAILED — POST .* HTTP 500/));
      const rest = Object.keys(REGIONAL_HOSTS).slice(2).join(", ");
      expect(error).toHaveBeenCalledWith(
        `Stopped before ${rest}; nothing was written to those zones.`,
      );
      expect(log).toHaveBeenCalledWith(
        `1 zone(s) deployed, 1 failed, ${zones.length - 2} not attempted.`,
      );
      const touched = new Set(fetch.mock.calls.map(([u]) => new URL(String(u)).pathname));
      for (const z of zones.slice(2)) expect(touched.has(`/pullzone/${z.Id}`)).toBe(false);
    });

    it("treats a collateral change on one zone as a failure and stops there", async () => {
      const zones = liveZones();
      for (const z of zones) z.ErrorPageEnableCustomCode = false;
      zones[0].OriginUrl = "https://origin";
      const { fetch, posts } = fakeBunny(zones, { sideEffect: { OriginUrl: null } });
      const { code, error } = run(["deploy"], fetch);

      expect(await code).toBe(2);
      expect(posts.map((p) => p.id)).toEqual([zones[0].Id]);
      expect(error).toHaveBeenCalledWith(expect.stringMatching(/also changed OriginUrl/));
    });
  });

  describe("probe", () => {
    const marker = "<title>Onetime Secret - Service Error</title>";
    /** The public hostnames as the pull zones answer them, by host. */
    function fakeEdge(answers: Record<string, { status: number; body: string }>) {
      return vi.fn(async (input: string | URL | Request) => {
        const { host } = new URL(String(input));
        const a = answers[host] ?? { status: 200, body: "<html><title>Onetime Secret</title></html>" };
        return new Response(a.body, {
          status: a.status,
          headers: { "CDN-PullZone": "1", "CDN-Cache": "MISS" },
        });
      });
    }
    const served = { status: 502, body: `<html>${marker}<div>502</div></html>` };
    const allServed = () =>
      Object.fromEntries(Object.values(REGIONAL_HOSTS).map((h) => [h, served]));

    it("needs no API key, reads no zones, and exits 0 when every region serves the page", async () => {
      const fetch = fakeEdge(allServed());
      const { code, log, loadEnv } = run(["probe"], fetch, {} as { BUNNY_API_KEY: string });

      expect(await code).toBe(0);
      expect(loadEnv).not.toHaveBeenCalled();
      const urls = fetch.mock.calls.map((c) => String(c[0]));
      expect(urls).toEqual(Object.values(REGIONAL_HOSTS).map((h) => `https://${h}/`));
      expect(log).toHaveBeenLastCalledWith("Every region served the custom page.");
    });

    it("exits 1 and says nothing was proven when the origin is up", async () => {
      const fetch = fakeEdge({});
      const { code, log } = run(["probe", "nz"], fetch);

      expect(await code).toBe(1);
      expect(fetch).toHaveBeenCalledTimes(1);
      const lines = log.mock.calls.map((c) => String(c[0]));
      expect(lines[0]).toMatch(/^nz {2}nz\.onetimesecret\.com\s+200 {2}via pull zone 1, cache MISS/);
      expect(lines.at(-2)).toMatch(/nothing proven/);
      expect(lines.at(-1)).toMatch(/set the zone's origin URL to a\nclosed port/);
    });

    it("exits 1 and names the region that served something else", async () => {
      const answers = allServed();
      answers[REGIONAL_HOSTS.eu] = { status: 503, body: "<html>bunny default</html>" };
      const { code, log } = run(["probe"], fakeEdge(answers));

      expect(await code).toBe(1);
      const lines = log.mock.calls.map((c) => String(c[0]));
      expect(lines.find((l) => l.startsWith("eu "))).toMatch(/503 {2}via pull zone 1: not the custom page/);
      expect(lines.at(-2)).toBe("1 region(s) did not serve the custom page.");
      expect(lines.at(-1)).toMatch(/Re-run verify/);
    });

    it("fetches a substitute hostname given as region=host", async () => {
      const fetch = fakeEdge({ "be2169e1-7.b-cdn.net": served });
      const { code, log } = run(["probe", "nz=be2169e1-7.b-cdn.net"], fetch);

      expect(await code).toBe(0);
      expect(fetch.mock.calls.map((c) => String(c[0]))).toEqual(["https://be2169e1-7.b-cdn.net/"]);
      expect(log.mock.calls[0][0]).toMatch(/^nz {2}be2169e1-7\.b-cdn\.net\s+502 {2}via pull zone 1: custom page served/);
    });

    it("rejects a zone name or ID where a hostname is expected", async () => {
      const fetch = fakeEdge({});

      expect(await rejection(run(["probe", "nz=123"], fetch).code)).toMatch(/region=hostname.*nz=123/);
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
