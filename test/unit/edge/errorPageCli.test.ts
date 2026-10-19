/**
 * @file errorPageCli.test.ts
 * @description Unit tests for edge/error-page/cli.mjs: which pull zones a
 * region resolves to, when a zone counts as out of date, how the zone list is
 * parsed, and what push, verify, deploy and scoped probe commands decide to write. The
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
import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  COMMANDS,
  EXPECTED_CHANGES,
  REGIONAL_HOSTS,
  envZoneRefs,
  main,
  normalize,
  pageMarker,
  parsePullZoneList,
  parseRegionArgs,
  pickRegions,
  planZone,
  probeRegion,
  selectRegionalZones,
  servingCheck,
  unexpectedChanges,
  zoneEnvVar,
} from "../../../edge/error-page/cli.mjs";
import { loadDotenv } from "../../../scripts/lib/bunny-api.mjs";
import { jurisdictions } from "../../../src/data/ops/jurisdictions";

const PAGE = "<html>\n<body>\n{{status_code}}\n</body>\n</html>";
const SCRIPT = resolve(import.meta.dirname, "../../../edge/error-page/cli.mjs");
const TEMPLATE = resolve(
  import.meta.dirname,
  "../../../edge/error-page/regional.html",
);

type FakeZone = Record<string, unknown> & {
  Id: number;
  Name: string;
  Hostnames: { Value: string }[];
};

function zone(
  id: number,
  hosts: string[],
  extra: Record<string, unknown> = {},
): FakeZone {
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
      const j = jurisdictions.find(
        (x) => x.identifier.toLowerCase() === region,
      );
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
      selectRegionalZones(zones, {
        eu: REGIONAL_HOSTS.eu,
        ca: REGIONAL_HOSTS.ca,
      });

    expect(attempt).toThrow(/ca\.onetimesecret\.com/);
    expect(attempt).toThrow(/BUNNY_PULL_ZONE_CA=/);
    expect(attempt).toThrow(/ ca=<zone name or ID>/);
  });

  describe("with a zone named for a region", () => {
    // A shield zone: generated name, only the b-cdn hostname, no public one.
    const shield = { ...zone(7, ["x9k2m4p1.b-cdn.net"]), Name: "x9k2m4p1" };
    const zones = [zone(2, ["eu.onetimesecret.com"]), shield];

    it("resolves the region to the zone by name, case-insensitively", () => {
      const selected = selectRegionalZones(
        zones,
        { nz: REGIONAL_HOSTS.nz },
        { nz: "X9K2M4P1" },
      );

      expect(selected).toEqual([
        { region: "nz", host: REGIONAL_HOSTS.nz, zone: shield },
      ]);
    });

    it("resolves the region to the zone by numeric ID", () => {
      const selected = selectRegionalZones(
        zones,
        { nz: REGIONAL_HOSTS.nz },
        { nz: "7" },
      );

      expect(selected.map((s) => s.zone.Id)).toEqual([7]);
    });

    it("still finds unnamed regions by hostname", () => {
      const hosts = { eu: REGIONAL_HOSTS.eu, nz: REGIONAL_HOSTS.nz };

      const selected = selectRegionalZones(zones, hosts, { nz: "x9k2m4p1" });

      expect(selected.map((s) => [s.region, s.zone.Id])).toEqual([
        ["eu", 2],
        ["nz", 7],
      ]);
    });

    it("fails when no zone has that name or ID", () => {
      expect(() =>
        selectRegionalZones(zones, { nz: REGIONAL_HOSTS.nz }, { nz: "nope" }),
      ).toThrow(/No pull zone named or numbered "nope" \(given for nz\)/);
      expect(() =>
        selectRegionalZones(zones, { nz: REGIONAL_HOSTS.nz }, { nz: "99" }),
      ).toThrow(/"99"/);
    });

    it("refuses a zone that carries another region's hostname", () => {
      expect(() =>
        selectRegionalZones(zones, { nz: REGIONAL_HOSTS.nz }, { nz: "zone-2" }),
      ).toThrow(/carries eu\.onetimesecret\.com, the eu hostname/);
    });

    it("accepts a zone that carries its own region's hostname", () => {
      const selected = selectRegionalZones(
        zones,
        { eu: REGIONAL_HOSTS.eu },
        { eu: "2" },
      );

      expect(selected.map((s) => s.zone.Id)).toEqual([2]);
    });
  });

  it.each([REGIONAL_HOSTS.eu, "eu-zone.b-cdn.net"])(
    "rejects by-host selection of %s for another region",
    (host) => {
      const zones = [zone(2, [REGIONAL_HOSTS.eu, "eu-zone.b-cdn.net"])];

      expect(() => selectRegionalZones(zones, { nz: host })).toThrow(
        /selected for nz.*the eu hostname/,
      );
    },
  );

  it("refuses a hostname attached to two zones", () => {
    const zones = [
      zone(2, ["eu.onetimesecret.com"]),
      zone(9, ["eu.onetimesecret.com"]),
    ];

    expect(() => selectRegionalZones(zones, { eu: REGIONAL_HOSTS.eu })).toThrow(
      /two pull zones/,
    );
  });

  it("never selects the marketing zone", () => {
    const zones = [
      zone(1, ["onetimesecret.com"]),
      ...Object.values(REGIONAL_HOSTS).map((host, i) => zone(10 + i, [host])),
    ];

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
      selected({
        ErrorPageEnableCustomCode: true,
        ErrorPageCustomCode: `\r\n${crlf}\r\n`,
      }),
      `${PAGE}\n`,
    );

    expect(plan.action).toBe("up-to-date");
  });

  it("updates a zone whose page matches but is disabled", () => {
    const plan = planZone(
      selected({ ErrorPageEnableCustomCode: false, ErrorPageCustomCode: PAGE }),
      PAGE,
    );

    expect([plan.action, plan.reason]).toEqual([
      "update",
      "custom error page disabled",
    ]);
  });

  it("updates a zone with no page at all", () => {
    const plan = planZone(selected({ ErrorPageEnableCustomCode: true }), PAGE);

    expect([plan.action, plan.reason]).toEqual([
      "update",
      "page content differs",
    ]);
  });

  it("updates a zone whose page differs", () => {
    const plan = planZone(
      selected({
        ErrorPageEnableCustomCode: true,
        ErrorPageCustomCode: "<html>old</html>",
      }),
      PAGE,
    );

    expect([plan.action, plan.id, plan.host]).toEqual([
      "update",
      2,
      REGIONAL_HOSTS.eu,
    ]);
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
    expect(pickRegions(["EU", "Uk"])).toEqual({
      eu: REGIONAL_HOSTS.eu,
      uk: REGIONAL_HOSTS.uk,
    });
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
    expect(parsePullZoneList({ Items: zones, HasMoreItems: false })).toBe(
      zones,
    );
  });

  it("refuses to work from a partial list", () => {
    expect(() =>
      parsePullZoneList({ Items: zones, HasMoreItems: true }),
    ).toThrow(/pagination/);
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
    const rest = Object.fromEntries(
      Object.entries(before).filter(([k]) => k !== "OriginUrl"),
    );
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
    const out = execFileSync(process.execPath, [SCRIPT, "--help"], {
      encoding: "utf8",
    });

    expect(out).toMatch(
      /^Usage: pnpm edge:error-page:<push\|verify\|deploy\|probe>/,
    );
    expect(out).toContain("BUNNY_PULL_ZONE_<REGION>");
    expect(out).toContain(Object.keys(REGIONAL_HOSTS).join(", "));
    for (const c of COMMANDS) expect(out).toMatch(new RegExp(`^  ${c} `, "m"));
  });

  it("names every pnpm script for its command", () => {
    const pkg = JSON.parse(
      readFileSync(resolve(SCRIPT, "../../../package.json"), "utf8"),
    );
    for (const c of COMMANDS) {
      expect(pkg.scripts[`edge:error-page:${c}`]).toBe(
        `node edge/error-page/cli.mjs ${c}`,
      );
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
    for (const [name, body] of Object.entries(files))
      writeFileSync(join(dir, name), body);
    return dir;
  }

  it("is silent when neither file exists", () => {
    expect(() => loadDotenv(root({}))).not.toThrow();
    expect(process.env[KEY]).toBeUndefined();
  });

  it("lets .env.local override .env, and the environment override both", () => {
    const r = root({
      ".env": `${KEY}=from-env\n`,
      ".env.local": `${KEY}=from-local\n`,
    });

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
    const gated = html.match(
      /@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n {6}\}/,
    );
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
    expect(text).not.toMatch(/take the origin down|closed port/i);
  });

  it("says when the page is served and where the by-hand checks live", () => {
    const text = servingCheck(plans);

    expect(text).toMatch(/500 from the app passes through/);
    expect(text).toContain('edge/README.md, "Regional error page"');
  });
});

describe("pageMarker", () => {
  it("is the template's title element", () => {
    expect(
      pageMarker("<html><title>Onetime Secret - Service Error</title></html>"),
    ).toBe("<title>Onetime Secret - Service Error</title>");
  });

  it("refuses a template without one", () => {
    expect(() => pageMarker("<html></html>")).toThrow(/no <title>/);
  });
});

describe("probeRegion", () => {
  const marker = "<title>Onetime Secret - Service Error</title>";
  const bunny = { "CDN-PullZone": "6421160", "CDN-Cache": "MISS" };
  const page = (
    status: number,
    body: string,
    headers: Record<string, string> = bunny,
  ) =>
    vi.fn(
      async () => new Response(body, { status, headers }),
    ) as unknown as typeof fetch;
  const probe = (f: typeof fetch) =>
    probeRegion(f, "nz", "nz.onetimesecret.com", marker);

  it("reports the pull zone Bunny answered from", async () => {
    const p = await probe(page(502, `<html>${marker}</html>`));

    expect(p).toMatchObject({
      outcome: "served",
      zone: "6421160",
      detail: /via pull zone 6421160/,
    });
  });

  it("calls an answer without Bunny's headers a hostname that bypasses the zone", async () => {
    const p = await probe(page(200, "<html>app</html>", {}));

    expect(p).toMatchObject({
      outcome: "direct",
      detail: /does not route through the zone/,
    });
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
    const [url, init] = (
      f as unknown as { mock: { calls: [string, RequestInit][] } }
    ).mock.calls[0];
    expect(url).toBe("https://nz.onetimesecret.com/");
    expect(init.redirect).toBe("manual");
  });

  it("calls a 2xx or 3xx the origin answering, whatever the body says", async () => {
    // The app's own homepage also says "Onetime Secret"; that must not count.
    expect(await probe(page(200, `<html>${marker}</html>`))).toMatchObject({
      outcome: "origin",
    });
    expect(await probe(page(302, ""))).toMatchObject({
      status: 302,
      outcome: "origin",
    });
    expect((await probe(page(200, "app"))).detail).toMatch(/cache MISS/);
  });

  it("distinguishes a 5xx that is not the page from one with an unfilled placeholder", async () => {
    expect(await probe(page(503, "<html>Bunny default</html>"))).toMatchObject({
      outcome: "other",
    });
    expect(await probe(page(502, `${marker}{{status_code}}`))).toMatchObject({
      outcome: "unfilled",
    });
  });

  it("turns a failed request into an outcome rather than throwing", async () => {
    const f = vi.fn(async () => {
      throw new Error("ECONNRESET");
    }) as unknown as typeof fetch;

    expect(await probe(f)).toMatchObject({
      status: 0,
      outcome: "error",
      detail: /ECONNRESET/,
    });
  });
});

describe("probeRegion scoped options", () => {
  const html = normalize(readFileSync(TEMPLATE, "utf8"));
  const filled = html
    .replaceAll("{{status_code}}", "502")
    .replaceAll("{{status_title}}", "Bad Gateway");
  const url =
    "https://nz.onetimesecret.com/.well-known/ots-error-page-probe/test/0";

  function check(body: string, zone = "6421160", status = 502) {
    const fetch = vi.fn(
      async () =>
        new Response(body, {
          status,
          headers: { "CDN-PullZone": zone },
        }),
    );
    const controller = new AbortController();
    const result = probeRegion(
      fetch,
      "nz",
      "nz.onetimesecret.com",
      pageMarker(html),
      {
        url,
        expectedZone: 6421160,
        html,
        signal: controller.signal,
      },
    );
    return { result, fetch };
  }

  it("uses the explicit URL without a serving credential and accepts the full filled template", async () => {
    const { result, fetch } = check(filled);

    expect(await result).toMatchObject({
      outcome: "served",
      status: 502,
      zone: "6421160",
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [input, init] = fetch.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(input).toBe(url);
    expect(init.redirect).toBe("manual");
    expect(new Headers(init.headers).has("AccessKey")).toBe(false);
  });

  it("rejects the correct page answered from a different pull zone", async () => {
    expect(await check(filled, "99").result).toMatchObject({
      outcome: "wrong-zone",
      zone: "99",
    });
  });

  it.each<[string, () => string]>([
    ["only the title", () => `<html>${pageMarker(html)}</html>`],
    [
      "a changed body",
      () => filled.replace("</body>", "<p>changed</p></body>"),
    ],
  ])("rejects %s even though the title matches", async (_name, body) => {
    expect(await check(body()).result).toMatchObject({ outcome: "content" });
  });

  it("still distinguishes unfilled placeholders from a full-content mismatch", async () => {
    expect(await check(html).result).toMatchObject({ outcome: "unfilled" });
  });

  it("does not accept a healthy response even when the full body matches", async () => {
    expect(await check(filled, "6421160", 200).result).toMatchObject({
      outcome: "origin",
    });
  });

  it("passes cancellation to the serving request", async () => {
    const controller = new AbortController();
    const fetch = vi.fn(async () => {
      controller.abort();
      throw new DOMException("cancelled", "AbortError");
    });

    expect(
      await probeRegion(fetch, "nz", "nz.onetimesecret.com", pageMarker(html), {
        url,
        expectedZone: 6421160,
        html,
        signal: controller.signal,
      }),
    ).toMatchObject({ outcome: "error" });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.signal?.aborted).toBe(true);
  });
});

describe("main", () => {
  const template = normalize(
    readFileSync(
      resolve(import.meta.dirname, "../../../edge/error-page/regional.html"),
      "utf8",
    ),
  );

  /** In-memory Bunny: a zone list plus a store the POSTs write into. */
  function fakeBunny(
    zones: FakeZone[],
    opts: { failIds?: number[]; sideEffect?: Record<string, unknown> } = {},
  ) {
    const store = new Map(zones.map((z) => [z.Id, { ...z }]));
    const posts: { id: number; body: Record<string, unknown> }[] = [];
    const fetch = vi.fn(
      async (input: string | URL | Request, init: RequestInit = {}) => {
        const path = new URL(String(input)).pathname;
        const json = (status: number, body: unknown) =>
          new Response(JSON.stringify(body), {
            status,
            headers: { "Content-Type": "application/json" },
          });
        if (path === "/pullzone") return json(200, [...store.values()]);
        const id = Number(path.split("/").pop());
        if (init.method === "POST") {
          if (opts.failIds?.includes(id))
            return new Response("boom", { status: 500 });
          const body = JSON.parse(String(init.body)) as Record<string, unknown>;
          posts.push({ id, body });
          // `sideEffect` simulates an API that resets unrelated fields on update.
          store.set(id, { ...store.get(id)!, ...body, ...opts.sideEffect });
          return json(200, store.get(id));
        }
        return json(200, store.get(id));
      },
    );
    return { fetch, posts, store };
  }

  function run(
    argv: string[],
    fetch: unknown,
    env: Record<string, string> = { BUNNY_API_KEY: "k" },
    deps: {
      sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
      signal?: AbortSignal;
    } = {},
  ) {
    const log = vi.fn();
    const error = vi.fn();
    const loadEnv = vi.fn();
    const noDelay: (
      ms: number,
      signal?: AbortSignal,
    ) => Promise<void> = async () => {};
    const sleep = vi.fn(noDelay);
    const code = main(argv, {
      env,
      fetch: fetch as typeof globalThis.fetch,
      loadEnv,
      log,
      error,
      sleep,
      ...deps,
    });
    return { code, log, error, loadEnv, sleep };
  }

  /** The rejection message of a promise, or "resolved" when it did not reject. */
  const rejection = (p: Promise<unknown>) =>
    p.then(
      () => "resolved",
      (err: unknown) => (err instanceof Error ? err.message : String(err)),
    );

  const liveZones = () =>
    Object.values(REGIONAL_HOSTS).map((host, i) =>
      zone(10 + i, [host], {
        ErrorPageEnableCustomCode: true,
        ErrorPageCustomCode: template,
      }),
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
    const { code, loadEnv } = run(
      ["push"],
      fetch,
      {} as { BUNNY_API_KEY: string },
    );

    expect(await rejection(code)).toMatch(/BUNNY_API_KEY is not set/);
    expect(loadEnv).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends the API key on every request", async () => {
    const { fetch } = fakeBunny(liveZones());
    await run(["push"], fetch, { BUNNY_API_KEY: "secret" }).code;

    for (const [, init] of fetch.mock.calls) {
      expect((init as RequestInit).headers).toEqual(
        expect.objectContaining({ AccessKey: "secret" }),
      );
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
    expect(log).toHaveBeenCalledWith(
      "1 zone(s) differ. Re-run with --apply to push.",
    );
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
      expect(body).toEqual({
        ErrorPageEnableCustomCode: true,
        ErrorPageCustomCode: template,
      });
    }
    expect(log).toHaveBeenCalledWith("2 zone(s) pushed, 0 failed.");
  });

  it("limits the push to the named regions, case-insensitively", async () => {
    const zones = liveZones();
    for (const z of zones) z.ErrorPageEnableCustomCode = false;
    const { fetch, posts } = fakeBunny(zones);
    const { code } = run(["push", "--apply", "UK"], fetch);

    expect(await code).toBe(0);
    expect(posts.map((p) => p.id)).toEqual([
      zones[Object.keys(REGIONAL_HOSTS).indexOf("uk")].Id,
    ]);
  });

  it("pushes to the zone named in the environment when it lacks the hostname", async () => {
    const zones = liveZones();
    const nz = zones[Object.keys(REGIONAL_HOSTS).indexOf("nz")];
    nz.Name = "x9k2m4p1";
    nz.Hostnames = [{ Value: "x9k2m4p1.b-cdn.net" }];
    nz.ErrorPageEnableCustomCode = false;
    const { fetch, posts } = fakeBunny(zones);

    const without = run(["push", "--apply"], fetch);
    expect(await rejection(without.code)).toMatch(
      /nz\.onetimesecret\.com.*BUNNY_PULL_ZONE_NZ/,
    );
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
    expect(await rejection(run(["sync"], fetch).code)).toMatch(
      /Unknown command "sync"/,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["verify", "deploy", "probe"])(
    "rejects --apply for %s",
    async (command) => {
      const { fetch } = fakeBunny([]);

      const message = await rejection(run([command, "--apply"], fetch).code);

      expect(message).toMatch(/--apply is for push only/);
      if (command === "probe")
        expect(message).not.toMatch(/probe never writes/);
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("keeps going after a failed zone and exits 2", async () => {
    const zones = liveZones();
    for (const z of zones) z.ErrorPageEnableCustomCode = false;
    const { fetch, posts } = fakeBunny(zones, { failIds: [zones[1].Id] });
    const { code, log, error } = run(["push", "--apply"], fetch);

    expect(await code).toBe(2);
    expect(posts).toHaveLength(zones.length - 1);
    expect(error).toHaveBeenCalledWith(
      expect.stringMatching(/FAILED — POST .* HTTP 500: boom/),
    );
    expect(log).toHaveBeenCalledWith(
      `${zones.length - 1} zone(s) pushed, 1 failed.`,
    );
  });

  it("fails a zone whose update changed a field it did not send", async () => {
    const zones = liveZones();
    zones[0].ErrorPageEnableCustomCode = false;
    zones[0].OriginUrl = "https://origin";
    const { fetch, store } = fakeBunny(zones, {
      sideEffect: { OriginUrl: null },
    });
    const { code, error } = run(["push", "--apply"], fetch);

    expect(await code).toBe(2);
    expect(error).toHaveBeenCalledWith(
      expect.stringMatching(/also changed OriginUrl/),
    );
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
      expect(lines.filter((l) => / {2}OK\n {4}origin/.test(l))).toHaveLength(
        zones.length,
      );
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
      const failing = (id: number) =>
        lines.find((l) => l.includes(`zone ${id} `)) ?? "";
      expect(failing(zones[0].Id)).toContain(
        "FAIL (custom error page disabled)",
      );
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

      expect(
        await run(["verify", "nz"], fetch).code.then(
          () => "ok",
          (e: Error) => e.message,
        ),
      ).toMatch(/BUNNY_PULL_ZONE_NZ/);
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
      expect(lines.filter((l) => / {2}OK\n {4}origin/.test(l))).toHaveLength(
        zones.length,
      );
      expect(lines.filter((l) => l.endsWith(", nothing to push"))).toHaveLength(
        zones.length - 2,
      );
      expect(lines.at(-1)).toBe(
        `${zones.length} zone(s) deployed and verified.`,
      );
      expect(lines.at(-2)).toContain("pnpm edge:error-page:probe");
      expect(lines.at(-2)).not.toContain("take the origin down");
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
      const paths = fetch.mock.calls
        .map(([u]) => new URL(String(u)).pathname)
        .slice(1);
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
      expect(error).toHaveBeenCalledWith(
        expect.stringMatching(/FAILED — POST .* HTTP 500/),
      );
      const rest = Object.keys(REGIONAL_HOSTS).slice(2).join(", ");
      expect(error).toHaveBeenCalledWith(
        `Stopped before ${rest}; nothing was written to those zones.`,
      );
      expect(log).toHaveBeenCalledWith(
        `1 zone(s) deployed, 1 failed, ${zones.length - 2} not attempted.`,
      );
      const touched = new Set(
        fetch.mock.calls.map(([u]) => new URL(String(u)).pathname),
      );
      for (const z of zones.slice(2))
        expect(touched.has(`/pullzone/${z.Id}`)).toBe(false);
    });

    it("treats a collateral change on one zone as a failure and stops there", async () => {
      const zones = liveZones();
      for (const z of zones) z.ErrorPageEnableCustomCode = false;
      zones[0].OriginUrl = "https://origin";
      const { fetch, posts } = fakeBunny(zones, {
        sideEffect: { OriginUrl: null },
      });
      const { code, error } = run(["deploy"], fetch);

      expect(await code).toBe(2);
      expect(posts.map((p) => p.id)).toEqual([zones[0].Id]);
      expect(error).toHaveBeenCalledWith(
        expect.stringMatching(/also changed OriginUrl/),
      );
    });
  });

  describe("probe", () => {
    type RuleBody = Record<string, unknown> & {
      Guid?: string;
      OrderIndex: number;
    };
    type Rule = RuleBody & { Guid: string };
    type Answer = {
      status: number;
      body: string;
      zone?: string;
      direct?: boolean;
    };
    type ProbeZone = FakeZone & { EdgeRules: Rule[] };
    type RequestRecord = { url: URL; method: string };
    type Options = {
      answer?: (z: ProbeZone, attempt: number, host: string) => Answer | Error;
      createFailure?: "http" | "network" | "timeout";
      installBeforeFailure?: boolean;
      installEffect?: (z: ProbeZone, rule: Rule) => void;
      createResponse?: (rule: Rule) => unknown;
      postInstallReadFailures?: number;
      deleteFailures?: number;
      deleteFailureAfterRemoval?: boolean;
      deleteMissingStatus?: 204 | 404;
      retainDeletedRule?: boolean;
      readFailure?: boolean;
      cleanupReadFailures?: number;
    };
    const served: Answer = {
      status: 502,
      body: template
        .replaceAll("{{status_code}}", "502")
        .replaceAll("{{status_title}}", "Bad Gateway"),
    };
    const healthy: Answer = {
      status: 200,
      body: "<html>healthy origin</html>",
    };
    const existingRule: Rule = {
      Guid: "11111111-1111-4111-8111-111111111111",
      OrderIndex: -7,
      ActionType: 0,
      ActionParameter1: "https://existing.invalid",
      Enabled: true,
    };

    /** Separate list snapshots, fresh zone reads, scoped rule writes and public serving. */
    function fakeProbe(zones = liveZones(), opts: Options = {}) {
      const store = new Map(
        zones.map((z) => [
          z.Id,
          {
            ...structuredClone(z),
            EdgeRules: structuredClone((z.EdgeRules ?? []) as Rule[]),
          } as ProbeZone,
        ]),
      );
      const posts: { id: number; body: RuleBody }[] = [];
      const created: { id: number; rule: Rule }[] = [];
      const deleted: { id: number; guid: string }[] = [];
      const serving: {
        host: string;
        id: number;
        guid: string;
        token: string;
        attempt: number;
      }[] = [];
      const requests: RequestRecord[] = [];
      let deleteFailures = opts.deleteFailures ?? 0;
      let cleanupReadFailures = opts.cleanupReadFailures ?? 0;
      let postInstallReadFailures = opts.postInstallReadFailures ?? 0;
      const json = (status: number, body: unknown) =>
        new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        });
      const fetch = vi.fn(
        async (input: string | URL | Request, init: RequestInit = {}) => {
          const url = new URL(String(input));
          const method = init.method ?? "GET";
          requests.push({ url, method });
          if (url.origin !== "https://api.bunny.net") {
            const z = [...store.values()].find((z) =>
              z.Hostnames.some((h) => h.Value === url.hostname),
            );
            if (!z) throw new Error(`Unexpected serving host: ${url.hostname}`);
            const match = url.pathname.match(
              /^\/\.well-known\/ots-error-page-probe\/([^/]+)\/(\d+)$/,
            );
            if (!match)
              throw new Error(`Unexpected serving path: ${url.pathname}`);
            const [, token, attemptText] = match;
            const rule = z.EdgeRules.find((r) => {
              const triggers = r.Triggers as
                { PatternMatches?: string[] }[] | undefined;
              return (
                r.Description === `OTS error-page probe ${token}` &&
                triggers?.[0]?.PatternMatches?.includes(
                  `${url.origin}/.well-known/ots-error-page-probe/${token}/*`,
                )
              );
            });
            if (!rule)
              throw new Error(
                "Serving requested without its scoped rule installed",
              );
            const attempt = Number(attemptText);
            serving.push({
              host: url.hostname,
              id: z.Id,
              guid: rule.Guid,
              token,
              attempt,
            });
            const answer = opts.answer?.(z, attempt, url.hostname) ?? served;
            if (answer instanceof Error) throw answer;
            return new Response(answer.body, {
              status: answer.status,
              headers: answer.direct
                ? {}
                : {
                    "CDN-PullZone": answer.zone ?? String(z.Id),
                    "CDN-Cache": "MISS",
                  },
            });
          }
          if (url.pathname === "/pullzone" && method === "GET") {
            return json(200, zones);
          }
          const match = url.pathname.match(
            /^\/pullzone\/(\d+)(?:\/edgerules\/(.+))?$/,
          );
          if (!match) throw new Error(`Unexpected API path: ${url.pathname}`);
          const id = Number(match[1]);
          const z = store.get(id);
          if (!z) return json(404, { error: "no zone" });
          const rulePath = match[2];
          if (!rulePath && method === "GET") {
            if (posts.length > 0 && postInstallReadFailures-- > 0) {
              return json(503, { error: "post-install read failed" });
            }
            if (serving.length > 0 && cleanupReadFailures-- > 0) {
              return json(503, { error: "cleanup read failed" });
            }
            return opts.readFailure
              ? json(503, { error: "read failed" })
              : json(200, z);
          }
          if (rulePath === "addOrUpdate" && method === "POST") {
            const body = JSON.parse(String(init.body)) as RuleBody;
            posts.push({ id, body });
            const existing = body.Guid
              ? z.EdgeRules.find((r) => r.Guid === body.Guid)
              : undefined;
            // addOrUpdate treats a supplied GUID as an update, never as a new identifier.
            if (body.Guid && !existing) {
              return json(404, { ErrorKey: "pullZone.edge_rule_not_found" });
            }
            let guid = existing?.Guid ?? randomUUID();
            while (
              !existing &&
              (z.EdgeRules.some((r) => r.Guid === guid) ||
                body.Description === `OTS error-page probe ${guid}` ||
                created.some((c) => c.rule.Guid === guid))
            )
              guid = randomUUID();
            const rule: Rule = { ...body, Guid: guid };
            if (!opts.createFailure || opts.installBeforeFailure !== false) {
              const storedRule = structuredClone(rule);
              if (existing)
                z.EdgeRules[z.EdgeRules.indexOf(existing)] = storedRule;
              else {
                z.EdgeRules.push(storedRule);
                created.push({ id, rule: structuredClone(rule) });
              }
              opts.installEffect?.(z, storedRule);
            }
            if (opts.createFailure === "http")
              return json(503, { error: "install failed" });
            if (opts.createFailure === "network")
              throw new Error("ECONNRESET after install");
            if (opts.createFailure === "timeout") {
              throw new DOMException("install timed out", "TimeoutError");
            }
            return json(
              existing ? 200 : 201,
              opts.createResponse ? opts.createResponse(rule) : rule,
            );
          }
          if (rulePath && method === "DELETE") {
            deleted.push({ id, guid: rulePath });
            const present = z.EdgeRules.some((r) => r.Guid === rulePath);
            if (!present && opts.deleteMissingStatus === 404) {
              return json(404, { error: "rule already absent" });
            }
            if (deleteFailures-- > 0) {
              if (opts.deleteFailureAfterRemoval) {
                z.EdgeRules = z.EdgeRules.filter((r) => r.Guid !== rulePath);
              }
              return json(503, { error: "delete failed" });
            }
            if (!opts.retainDeletedRule) {
              z.EdgeRules = z.EdgeRules.filter((r) => r.Guid !== rulePath);
            }
            return new Response(null, { status: 204 });
          }
          throw new Error(`Unexpected API write: ${method} ${url.pathname}`);
        },
      );
      return { fetch, store, posts, created, deleted, serving, requests };
    }
    type FakeProbe = ReturnType<typeof fakeProbe>;
    const nzZone = (zones: FakeZone[]) =>
      zones.find((z) =>
        z.Hostnames.some((h) => h.Value === REGIONAL_HOSTS.nz),
      )!;

    function probeToken(rule: RuleBody) {
      const token = String(rule.Description).replace(
        /^OTS error-page probe /,
        "",
      );
      expect(rule.Description).toBe(`OTS error-page probe ${token}`);
      expect(token).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      return token;
    }

    function expectCleaned(fake: FakeProbe, id: number, guid: string) {
      expect(fake.deleted).toEqual(expect.arrayContaining([{ id, guid }]));
      expect(fake.store.get(id)!.EdgeRules.some((r) => r.Guid === guid)).toBe(
        false,
      );
      const index = fake.requests.findLastIndex(
        (r) =>
          r.method === "DELETE" &&
          r.url.pathname === `/pullzone/${id}/edgerules/${guid}`,
      );
      // Delete the server-assigned GUID, never the URL token; then confirm absence.
      expect(fake.requests[index + 1]).toMatchObject({
        method: "GET",
        url: expect.objectContaining({ pathname: `/pullzone/${id}` }),
      });
    }

    function expectUntouched(fake: FakeProbe, id: number) {
      expect(
        fake.requests.some((r) => r.url.pathname.startsWith(`/pullzone/${id}`)),
      ).toBe(false);
      expect(fake.serving.some((s) => s.id === id)).toBe(false);
    }

    it("models Bunny rejecting an unknown POST Guid with the production 404 error", async () => {
      const zones = liveZones();
      const nz = nzZone(zones);
      nz.EdgeRules = [existingRule];
      const fake = fakeProbe(zones);
      const response = await fake.fetch(
        `https://api.bunny.net/pullzone/${nz.Id}/edgerules/addOrUpdate`,
        {
          method: "POST",
          body: JSON.stringify({ ...existingRule, Guid: randomUUID() }),
        },
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        ErrorKey: "pullZone.edge_rule_not_found",
      });
      expect(fake.created).toEqual([]);
      expect(fake.store.get(nz.Id)!.EdgeRules).toEqual([existingRule]);
    });

    it("models Bunny creating without Guid with HTTP 201 and a distinct server UUID", async () => {
      const fake = fakeProbe();
      const id = nzZone(liveZones()).Id;
      const token = randomUUID();
      const body: RuleBody = {
        ...existingRule,
        Description: `OTS error-page probe ${token}`,
      };
      delete body.Guid;
      const response = await fake.fetch(
        `https://api.bunny.net/pullzone/${id}/edgerules/addOrUpdate`,
        { method: "POST", body: JSON.stringify(body) },
      );
      const rule = (await response.json()) as Rule;

      expect(response.status).toBe(201);
      expect(rule).toMatchObject(body);
      expect(rule.Guid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(rule.Guid).not.toBe(token);
      expect(fake.created).toEqual([{ id, rule }]);
      expect(fake.store.get(id)!.EdgeRules).toEqual([rule]);
    });

    it("models Bunny permitting updates only to an existing Guid", async () => {
      const zones = liveZones();
      const nz = nzZone(zones);
      nz.EdgeRules = [existingRule];
      const fake = fakeProbe(zones);
      const body = { ...existingRule, Description: "updated existing rule" };
      const response = await fake.fetch(
        `https://api.bunny.net/pullzone/${nz.Id}/edgerules/addOrUpdate`,
        { method: "POST", body: JSON.stringify(body) },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(body);
      expect(fake.created).toEqual([]);
      expect(fake.store.get(nz.Id)!.EdgeRules).toEqual([body]);
    });

    it.each([{ args: ["nz"] }, { args: ["eu", "uk"] }, { args: [] }])(
      "names only the probed regions in the success summary ($args)",
      async ({ args }) => {
        const fake = fakeProbe();
        const { code, log } = run(["probe", ...args], fake.fetch);

        expect(await code).toBe(0);
        const regions = args.length ? args : Object.keys(REGIONAL_HOSTS);
        expect(log.mock.calls.at(-1)?.[0]).toBe(
          `Custom page served for ${regions.join(", ")}.`,
        );
      },
    );

    it("omits Guid from the raw create POST and uses a fresh URL token, not the server GUID", async () => {
      const fake = fakeProbe();
      const result = await run(["probe", "nz"], fake.fetch).code;
      const post = fake.fetch.mock.calls.find(
        ([, init]) => init?.method === "POST",
      )!;
      const body = JSON.parse(String(post[1]?.body)) as RuleBody;

      expect(body).not.toHaveProperty("Guid");
      const token = probeToken(body);
      expect(result).toBe(0);
      expect(fake.created).toHaveLength(1);
      const { id, rule } = fake.created[0];
      expect(rule.Guid).not.toBe(token);
      expect(fake.serving).toEqual([
        { host: REGIONAL_HOSTS.nz, id, guid: rule.Guid, token, attempt: 0 },
      ]);
      expect(fake.deleted).toEqual([{ id, guid: rule.Guid }]);
      expectCleaned(fake, id, rule.Guid);
    });

    it("loads env, probes every region serially, authenticates only API calls and removes each rule", async () => {
      const zones = liveZones();
      for (const z of zones) z.EdgeRules = [existingRule];
      const fake = fakeProbe(zones);
      const { code, loadEnv } = run(["probe"], fake.fetch, {
        BUNNY_API_KEY: "secret",
      });

      expect(await code).toBe(0);
      expect(loadEnv).toHaveBeenCalledTimes(1);
      expect(fake.requests[0]).toMatchObject({
        method: "GET",
        url: expect.objectContaining({ pathname: "/pullzone" }),
      });
      expect(fake.created.map((c) => c.id)).toEqual(zones.map((z) => z.Id));
      expect(fake.serving.map((s) => s.host)).toEqual(
        Object.values(REGIONAL_HOSTS),
      );
      expect(new Set(fake.created.map((c) => c.rule.Guid)).size).toBe(
        zones.length,
      );
      expect(new Set(fake.created.map((c) => probeToken(c.rule))).size).toBe(
        zones.length,
      );
      for (const [index, z] of zones.entries()) {
        const { rule } = fake.created[index];
        expect(rule.Guid).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
        const token = probeToken(rule);
        const host = Object.values(REGIONAL_HOSTS)[index];
        expect(rule.Guid).not.toBe(token);
        expect(fake.posts[index].body).not.toHaveProperty("Guid");
        expect(rule).toMatchObject({
          ActionType: 2,
          ActionParameter1: "https://error-page-probe.invalid",
          Enabled: true,
          TriggerMatchingType: 1,
          Triggers: [
            {
              Type: 0,
              PatternMatchingType: 0,
              PatternMatches: [
                `https://${host}/.well-known/ots-error-page-probe/${token}/*`,
              ],
            },
          ],
          ExtraActions: [
            { ActionType: 3, ActionParameter1: "0" },
            { ActionType: 15, ActionParameter1: "" },
          ],
        });
        expect(rule.OrderIndex).toBeLessThan(existingRule.OrderIndex);
        expect(fake.serving[index]).toEqual({
          host,
          id: z.Id,
          guid: rule.Guid,
          token,
          attempt: 0,
        });
        const install = fake.requests.findIndex(
          (r) =>
            r.method === "POST" &&
            r.url.pathname === `/pullzone/${z.Id}/edgerules/addOrUpdate`,
        );
        expect(fake.requests[install - 1]).toMatchObject({
          method: "GET",
          url: expect.objectContaining({ pathname: `/pullzone/${z.Id}` }),
        });
        expectCleaned(fake, z.Id, rule.Guid);
        if (index < zones.length - 1) {
          const next = fake.requests.findIndex(
            (r) => r.url.pathname === `/pullzone/${zones[index + 1].Id}`,
          );
          const last = fake.requests.findLastIndex(
            (r) => r.url.pathname === `/pullzone/${z.Id}`,
          );
          expect(last).toBeLessThan(next);
        }
      }
      for (const [input, init] of fake.fetch.mock.calls) {
        const url = new URL(String(input));
        const headers = new Headers(init?.headers);
        expect(headers.get("AccessKey")).toBe(
          url.hostname === "api.bunny.net" ? "secret" : null,
        );
        if (url.hostname !== "api.bunny.net")
          expect(init?.redirect).toBe("manual");
        if (init?.method === "POST") {
          expect(url.pathname).toMatch(
            /^\/pullzone\/\d+\/edgerules\/addOrUpdate$/,
          );
          expect(JSON.parse(String(init?.body))).not.toHaveProperty("Guid");
        }
      }
    });

    it("retries a healthy origin during propagation, then proves the page and cleans up", async () => {
      const fake = fakeProbe(liveZones(), {
        answer: (_z, attempt) => (attempt < 2 ? healthy : served),
      });
      const { code, sleep, log } = run(["probe", "nz"], fake.fetch);

      expect(await code).toBe(0);
      expect(fake.serving.map((s) => s.attempt)).toEqual([0, 1, 2]);
      const requests = fake.requests.filter(
        (r) => r.url.hostname === REGIONAL_HOSTS.nz,
      );
      const urls = log.mock.calls
        .map(([line]) => line as string)
        .filter((line) => line.startsWith("nz: probe URL "));
      expect(urls).toEqual(requests.map((r) => `nz: probe URL ${r.url.href}`));
      expect(new Set(fake.serving.map((s) => s.guid)).size).toBe(1);
      expect(sleep).toHaveBeenCalledTimes(2);
      expect(sleep.mock.calls.every(([ms]) => ms > 0)).toBe(true);
      expect(fake.created).toHaveLength(1);
      expectCleaned(fake, fake.created[0].id, fake.created[0].rule.Guid);
    });

    it("exhausts twelve healthy responses, cleans up and stops before the next region with exit 1", async () => {
      const zones = liveZones();
      const fake = fakeProbe(zones, { answer: () => healthy });
      const { code, sleep } = run(["probe", "nz", "eu"], fake.fetch);

      expect(await code).toBe(1);
      expect(fake.serving.map((s) => s.attempt)).toEqual(
        Array.from({ length: 12 }, (_, i) => i),
      );
      expect(sleep).toHaveBeenCalledTimes(11);
      expect(fake.created).toHaveLength(1);
      expectCleaned(fake, fake.created[0].id, fake.created[0].rule.Guid);
      expectUntouched(fake, zones[0].Id);
    });

    it.each<[string, Answer | Error]>([
      ["noncustom", { status: 503, body: "<html>Bunny default</html>" }],
      ["unfilled", { status: 502, body: template }],
      [
        "content mismatch",
        { ...served, body: served.body.replace("</body>", "changed</body>") },
      ],
      [
        "title only",
        { status: 502, body: `<html>${pageMarker(template)}</html>` },
      ],
      ["wrong zone", { ...served, zone: "999999" }],
      ["direct host", { ...served, direct: true }],
      ["failed request", new Error("ECONNRESET")],
    ])(
      "returns 1 for %s, cleans up and never starts the next region",
      async (_name, answer) => {
        const zones = liveZones();
        const fake = fakeProbe(zones, { answer: () => answer });
        const { code } = run(["probe", "nz", "eu"], fake.fetch);

        expect(await code).toBe(1);
        expect(fake.serving.length).toBeGreaterThan(0);
        expect(fake.serving.length).toBeLessThanOrEqual(12);
        expect(fake.created).toHaveLength(1);
        expectCleaned(fake, fake.created[0].id, fake.created[0].rule.Guid);
        expectUntouched(fake, zones[0].Id);
      },
    );

    it.each<[string, Record<string, unknown>]>([
      ["disabled", { ErrorPageEnableCustomCode: false }],
      ["different content", { ErrorPageCustomCode: "<html>old</html>" }],
    ])(
      "checks the fresh zone, not the list snapshot, and refuses %s config before installing",
      async (_name, patch) => {
        const zones = liveZones();
        const fake = fakeProbe(zones);
        Object.assign(fake.store.get(nzZone(zones).Id)!, patch);
        const { code } = run(["probe", "nz", "eu"], fake.fetch);

        expect(await code).toBe(1);
        expect(fake.created).toEqual([]);
        expect(fake.deleted).toEqual([]);
        expect(fake.serving).toEqual([]);
        expectUntouched(fake, zones[0].Id);
      },
    );

    it("preserves unrelated fields, existing rules and a rule concurrently added while serving", async () => {
      const zones = liveZones();
      const nz = nzZone(zones);
      Object.assign(nz, {
        OriginUrl: "https://real-origin.invalid",
        EnableGeoZoneEU: true,
        CacheControlMaxAgeOverride: 3600,
        EdgeRules: [
          existingRule,
          { ...existingRule, Guid: "other-rule", OrderIndex: 3 },
        ],
      });
      const concurrent = {
        ...existingRule,
        Guid: "concurrent-rule",
        OrderIndex: 20,
      };
      const fake = fakeProbe(zones, {
        answer: (z) => {
          z.EdgeRules.push(concurrent);
          return served;
        },
      });
      const before = structuredClone(fake.store.get(nz.Id)!);

      expect(await run(["probe", "nz"], fake.fetch).code).toBe(0);
      expect(fake.store.get(nz.Id)).toEqual({
        ...before,
        EdgeRules: [...before.EdgeRules, concurrent],
      });
      expect(fake.created).toHaveLength(1);
      expect(fake.deleted).toEqual([
        { id: nz.Id, guid: fake.created[0].rule.Guid },
      ]);
      expectCleaned(fake, nz.Id, fake.created[0].rule.Guid);
    });

    it.each(["http", "network", "timeout"] as const)(
      "cleans up ambiguous server success after a %s install failure and stops with exit 2",
      async (createFailure) => {
        const zones = liveZones();
        const fake = fakeProbe(zones, { createFailure });

        expect(await run(["probe", "nz", "eu"], fake.fetch).code).toBe(2);
        expect(fake.created).toHaveLength(1);
        expect(fake.serving).toEqual([]);
        const { id, rule } = fake.created[0];
        expectCleaned(fake, id, rule.Guid);
        expect(fake.deleted).toEqual([{ id, guid: rule.Guid }]);
        expect(rule.Guid).not.toBe(probeToken(rule));
        const install = fake.requests.findIndex((r) => r.method === "POST");
        expect(fake.requests.slice(install + 1).map((r) => r.method)).toEqual([
          "GET",
          "DELETE",
          "GET",
        ]);
        expectUntouched(fake, zones[0].Id);
      },
    );

    it("retries discovery when a timed-out create commits after the first empty read", async () => {
      const zones = liveZones();
      const nz = nzZone(zones);
      const fake = fakeProbe(zones, {
        createFailure: "network",
        installBeforeFailure: false,
      });
      const fetch = async (
        input: string | URL | Request,
        init: RequestInit = {},
      ) => {
        const response = await fake.fetch(input, init);
        const url = new URL(String(input));
        if (
          url.pathname === `/pullzone/${nz.Id}` &&
          fake.posts.length &&
          !fake.created.length
        ) {
          // The first read is already serialized empty; creation commits just afterward.
          const rule: Rule = { ...fake.posts[0].body, Guid: randomUUID() };
          fake.store.get(nz.Id)!.EdgeRules.push(rule);
          fake.created.push({ id: nz.Id, rule });
        }
        return response;
      };
      const { code, sleep } = run(["probe", "nz", "eu"], fetch);

      expect(await code).toBe(2);
      expect(fake.created).toHaveLength(1);
      expectCleaned(fake, nz.Id, fake.created[0].rule.Guid);
      expect(sleep).toHaveBeenCalledTimes(1);
      expectUntouched(fake, zones[0].Id);
    });

    it.each([204, 404] as const)(
      "confirms absence without DELETE after rejected creation (missing rule DELETE would be %s)",
      async (deleteMissingStatus) => {
        const zones = liveZones();
        const fake = fakeProbe(zones, {
          createFailure: "http",
          installBeforeFailure: false,
          deleteMissingStatus,
        });
        const { code } = run(["probe", "nz"], fake.fetch);

        expect(await code).toBe(2);
        expect(fake.posts).toHaveLength(1);
        expect(fake.posts[0].body).not.toHaveProperty("Guid");
        expect(fake.created).toEqual([]);
        expect(fake.deleted).toEqual([]);
        expect(fake.store.get(nzZone(zones).Id)!.EdgeRules).toEqual([]);
        const install = fake.requests.findIndex((r) => r.method === "POST");
        expect(fake.requests.slice(install + 1).map((r) => r.method)).toEqual([
          "GET",
          "GET",
          "GET",
        ]);
      },
    );

    it.each(["omitted", "empty", "invalid"] as const)(
      "discovers the server GUID by unique Description when the response Guid is %s",
      async (kind) => {
        const zones = liveZones();
        const nz = nzZone(zones);
        nz.EdgeRules = [existingRule];
        const fake = fakeProbe(zones, {
          createResponse: (rule) => {
            const body: RuleBody = { ...rule };
            delete body.Guid;
            return kind === "omitted"
              ? body
              : { ...body, Guid: kind === "empty" ? "" : "invalid" };
          },
        });

        expect(await run(["probe", "nz"], fake.fetch).code).toBe(0);
        expect(fake.created).toHaveLength(1);
        const { rule } = fake.created[0];
        expect(fake.serving).toHaveLength(1);
        expect(fake.serving[0].guid).toBe(rule.Guid);
        expect(fake.deleted).toEqual([{ id: nz.Id, guid: rule.Guid }]);
        expectCleaned(fake, nz.Id, rule.Guid);
        expect(fake.store.get(nz.Id)!.EdgeRules).toEqual([existingRule]);
      },
    );

    it("never trusts a returned pre-existing GUID or deletes that rule during discovery", async () => {
      const zones = liveZones();
      const nz = nzZone(zones);
      nz.EdgeRules = [existingRule];
      const fake = fakeProbe(zones, {
        createResponse: (rule) => ({ ...rule, Guid: existingRule.Guid }),
        // Even a matching description cannot confer ownership of a pre-existing GUID.
        installEffect: (z, rule) => {
          z.EdgeRules.find((r) => r.Guid === existingRule.Guid)!.Description =
            rule.Description;
        },
      });

      expect(await run(["probe", "nz", "eu"], fake.fetch).code).toBe(2);
      expect(fake.serving).toEqual([]);
      expect(fake.created).toHaveLength(1);
      const { rule } = fake.created[0];
      expect(fake.deleted).toEqual([{ id: nz.Id, guid: rule.Guid }]);
      expectCleaned(fake, nz.Id, rule.Guid);
      expect(fake.store.get(nz.Id)!.EdgeRules).toEqual([
        { ...existingRule, Description: rule.Description },
      ]);
      expectUntouched(fake, zones[0].Id);
    });

    it("uses a known returned GUID for direct cleanup even when installation readback fails", async () => {
      const fake = fakeProbe(liveZones(), { postInstallReadFailures: 1 });

      expect(await run(["probe", "nz"], fake.fetch).code).toBe(2);
      expect(fake.created).toHaveLength(1);
      expect(fake.serving).toEqual([]);
      const { id, rule } = fake.created[0];
      expect(fake.deleted).toEqual([{ id, guid: rule.Guid }]);
      expectCleaned(fake, id, rule.Guid);
      const install = fake.requests.findIndex((r) => r.method === "POST");
      expect(fake.requests.slice(install + 1).map((r) => r.method)).toEqual([
        "GET",
        "DELETE",
        "GET",
      ]);
    });

    it("bounds discovery to three reads without deleting a token when the create response is lost", async () => {
      const zones = liveZones();
      const nz = nzZone(zones);
      nz.EdgeRules = [existingRule];
      const fake = fakeProbe(zones, {
        createFailure: "network",
        postInstallReadFailures: 99,
      });
      const { code, sleep } = run(["probe", "nz", "eu"], fake.fetch);

      expect(await code).toBe(2);
      expect(fake.created).toHaveLength(1);
      expect(fake.deleted).toEqual([]);
      expect(fake.serving).toEqual([]);
      const install = fake.requests.findIndex((r) => r.method === "POST");
      expect(fake.requests.slice(install + 1).map((r) => r.method)).toEqual([
        "GET",
        "GET",
        "GET",
      ]);
      expect(sleep).toHaveBeenCalledTimes(2);
      expect(fake.store.get(nz.Id)!.EdgeRules).toEqual([
        existingRule,
        fake.created[0].rule,
      ]);
      expectUntouched(fake, zones[0].Id);
    });

    it("discovers and removes an altered-trigger rule by Description after a lost create response", async () => {
      const zones = liveZones();
      const nz = nzZone(zones);
      nz.EdgeRules = [existingRule];
      const fake = fakeProbe(zones, {
        createFailure: "network",
        installEffect: (_z, rule) => {
          const triggers = rule.Triggers as Record<string, unknown>[];
          triggers[0].PatternMatches = [`https://${REGIONAL_HOSTS.nz}/*`];
        },
      });

      expect(await run(["probe", "nz", "eu"], fake.fetch).code).toBe(2);
      expect(fake.created).toHaveLength(1);
      const { rule } = fake.created[0];
      expect(fake.deleted).toEqual([{ id: nz.Id, guid: rule.Guid }]);
      expectCleaned(fake, nz.Id, rule.Guid);
      expect(fake.store.get(nz.Id)!.EdgeRules).toEqual([existingRule]);
      expect(fake.serving).toEqual([]);
      expectUntouched(fake, zones[0].Id);
    });

    it("accepts API-added default and null fields in the installed rule readback", async () => {
      const zones = liveZones();
      const nz = nzZone(zones);
      nz.EdgeRules = [existingRule];
      const installEffect = vi.fn((_z: ProbeZone, rule: Rule) => {
        Object.assign(rule, {
          ActionParameter2: null,
          ActionParameter3: null,
          ReadOnly: false,
        });
        rule.Triggers = (rule.Triggers as Record<string, unknown>[]).map(
          (trigger) => ({
            ...trigger,
            Parameter1: null,
          }),
        );
        rule.ExtraActions = (
          rule.ExtraActions as Record<string, unknown>[]
        ).map((action) => ({
          ...action,
          ActionParameter2: null,
          ActionParameter3: null,
          ReadOnly: false,
        }));
      });
      const fake = fakeProbe(zones, { installEffect });
      const { code, error } = run(["probe", "nz"], fake.fetch);

      expect(await code).toBe(0);
      expect(installEffect).toHaveBeenCalledTimes(1);
      expect(error).not.toHaveBeenCalled();
      expect(fake.created).toHaveLength(1);
      expect(fake.created[0].rule).not.toHaveProperty("ReadOnly");
      expect(fake.serving).toHaveLength(1);
      expectCleaned(fake, nz.Id, fake.created[0].rule.Guid);
      expect(fake.store.get(nz.Id)!.EdgeRules).toEqual([existingRule]);
    });

    it("accepts the named enum schema in readback while retaining numeric enums in the request", async () => {
      const zones = liveZones();
      const nz = nzZone(zones);
      nz.EdgeRules = [existingRule];
      const installEffect = vi.fn((_z: ProbeZone, rule: Rule) => {
        const triggers = rule.Triggers as Record<string, unknown>[];
        const actions = rule.ExtraActions as Record<string, unknown>[];
        const namedSchema = {
          ActionType: "OriginUrl",
          TriggerMatchingType: "MatchAll",
          Triggers: [
            { ...triggers[0], Type: "Url", PatternMatchingType: "MatchAny" },
          ],
          ExtraActions: [
            { ...actions[0], ActionType: "OverrideCacheTime" },
            { ...actions[1], ActionType: "BypassPermaCache" },
          ],
        };
        Object.assign(rule, namedSchema);
      });
      const fake = fakeProbe(zones, { installEffect });
      const { code, error } = run(["probe", "nz"], fake.fetch);

      expect(await code).toBe(0);
      expect(installEffect).toHaveBeenCalledTimes(1);
      expect(error).not.toHaveBeenCalled();
      expect(fake.created).toHaveLength(1);
      expect(fake.created[0].rule).toMatchObject({
        ActionType: 2,
        TriggerMatchingType: 1,
        Triggers: [{ Type: 0, PatternMatchingType: 0 }],
        ExtraActions: [
          { ActionType: 3, ActionParameter1: "0" },
          { ActionType: 15, ActionParameter1: "" },
        ],
      });
      expect(fake.serving).toHaveLength(1);
      expectCleaned(fake, nz.Id, fake.created[0].rule.Guid);
      expect(fake.store.get(nz.Id)!.EdgeRules).toEqual([existingRule]);
    });

    it("rejects an altered trigger in installation readback, cleans up and stops", async () => {
      const zones = liveZones();
      const nz = nzZone(zones);
      nz.EdgeRules = [existingRule];
      const fake = fakeProbe(zones, {
        installEffect: (_z, rule) => {
          const triggers = rule.Triggers as Record<string, unknown>[];
          triggers[0].PatternMatches = ["https://nz.onetimesecret.com/*"];
        },
      });
      const { code, error } = run(["probe", "nz", "eu"], fake.fetch);

      expect(await code).toBe(2);
      expect(error).toHaveBeenCalledWith(
        expect.stringMatching(/probe rule read-back does not match/),
      );
      expect(fake.created).toHaveLength(1);
      expect(fake.serving).toEqual([]);
      expectCleaned(fake, nz.Id, fake.created[0].rule.Guid);
      expect(fake.store.get(nz.Id)!.EdgeRules).toEqual([existingRule]);
      expectUntouched(fake, zones[0].Id);
    });

    it("detects a collateral OriginUrl change during installation and cleans up without restoring the zone", async () => {
      const zones = liveZones();
      const nz = nzZone(zones);
      nz.OriginUrl = "https://real-origin.invalid";
      nz.EdgeRules = [existingRule];
      const fake = fakeProbe(zones, {
        installEffect: (z) => {
          z.OriginUrl = "https://changed-origin.invalid";
        },
      });
      const { code, error } = run(["probe", "nz", "eu"], fake.fetch);

      expect(await code).toBe(2);
      expect(error).toHaveBeenCalledWith(
        expect.stringMatching(/probe installation also changed OriginUrl/),
      );
      expect(fake.created).toHaveLength(1);
      expect(fake.serving).toEqual([]);
      expectCleaned(fake, nz.Id, fake.created[0].rule.Guid);
      expect(fake.store.get(nz.Id)!.OriginUrl).toBe(
        "https://changed-origin.invalid",
      );
      expect(fake.store.get(nz.Id)!.EdgeRules).toEqual([existingRule]);
      expectUntouched(fake, zones[0].Id);
    });

    it("retries transient cleanup failures and succeeds only after confirmed removal", async () => {
      const fake = fakeProbe(liveZones(), { deleteFailures: 2 });

      expect(await run(["probe", "nz"], fake.fetch).code).toBe(0);
      expect(fake.deleted).toHaveLength(3);
      expectCleaned(fake, fake.created[0].id, fake.created[0].rule.Guid);
    });

    it.each<[string, Options]>([
      ["DELETE errors", { deleteFailures: 99 }],
      [
        "successful DELETE that leaves the rule present",
        { retainDeletedRule: true },
      ],
    ])(
      "bounds cleanup to three tries for %s and stops before the next region with exit 2",
      async (_name, opts) => {
        const zones = liveZones();
        const fake = fakeProbe(zones, opts);

        expect(await run(["probe", "nz", "eu"], fake.fetch).code).toBe(2);
        expect(fake.created).toHaveLength(1);
        expect(fake.deleted).toHaveLength(3);
        expect(fake.store.get(nzZone(zones).Id)!.EdgeRules).toEqual(
          expect.arrayContaining([fake.created[0].rule]),
        );
        expectUntouched(fake, zones[0].Id);
      },
    );

    it("accepts a DELETE error only after a fresh read confirms the own rule is absent", async () => {
      const zones = liveZones();
      const nz = nzZone(zones);
      nz.EdgeRules = [existingRule];
      const fake = fakeProbe(zones, {
        deleteFailures: 99,
        deleteFailureAfterRemoval: true,
      });
      const { code, error } = run(["probe", "nz"], fake.fetch);

      expect(await code).toBe(0);
      expect(error).not.toHaveBeenCalled();
      expect(fake.deleted).toEqual([
        { id: nz.Id, guid: fake.created[0].rule.Guid },
      ]);
      expectCleaned(fake, nz.Id, fake.created[0].rule.Guid);
      expect(fake.store.get(nz.Id)!.EdgeRules).toEqual([existingRule]);
    });

    it("cleanup failure takes precedence over an unsuccessful serving check", async () => {
      const zones = liveZones();
      const fake = fakeProbe(zones, {
        answer: () => healthy,
        deleteFailures: 99,
      });

      expect(await run(["probe", "nz", "eu"], fake.fetch).code).toBe(2);
      expect(fake.deleted).toHaveLength(3);
      expectUntouched(fake, zones[0].Id);
    });

    it("returns 2 for a fresh zone read failure without installing or serving the next region", async () => {
      const zones = liveZones();
      const fake = fakeProbe(zones, { readFailure: true });

      expect(await run(["probe", "nz", "eu"], fake.fetch).code).toBe(2);
      expect(fake.created).toEqual([]);
      expect(fake.serving).toEqual([]);
      expectUntouched(fake, zones[0].Id);
    });

    it.each([204, 404] as const)(
      "retries after DELETE succeeds but the first cleanup read fails (missing rule DELETE %s)",
      async (deleteMissingStatus) => {
        const fake = fakeProbe(liveZones(), {
          cleanupReadFailures: 1,
          deleteMissingStatus,
        });
        const { code, sleep } = run(["probe", "nz"], fake.fetch);

        expect(await code).toBe(0);
        expect(fake.created).toHaveLength(1);
        const { id, rule } = fake.created[0];
        expect(fake.deleted).toEqual([
          { id, guid: rule.Guid },
          { id, guid: rule.Guid },
        ]);
        expect(sleep).toHaveBeenCalledTimes(1);
        expectCleaned(fake, id, rule.Guid);
        const serving = fake.requests.findLastIndex(
          (r) => r.url.hostname !== "api.bunny.net",
        );
        expect(fake.requests.slice(serving + 1).map((r) => r.method)).toEqual([
          "DELETE",
          "GET",
          "DELETE",
          "GET",
        ]);
      },
    );

    it("removes its own rule but returns 2 after three failed cleanup verification reads", async () => {
      const zones = liveZones();
      const nz = nzZone(zones);
      nz.EdgeRules = [existingRule];
      const fake = fakeProbe(zones, {
        cleanupReadFailures: 99,
        deleteMissingStatus: 404,
      });

      expect(await run(["probe", "nz", "eu"], fake.fetch).code).toBe(2);
      expect(fake.created).toHaveLength(1);
      const guid = fake.created[0].rule.Guid;
      expect(fake.deleted).toEqual(
        Array.from({ length: 3 }, () => ({ id: nz.Id, guid })),
      );
      expect(fake.store.get(nz.Id)!.EdgeRules).toEqual([existingRule]);
      // Installation has its own readback; only reads after serving are cleanup attempts.
      const serving = fake.requests.findLastIndex(
        (r) => r.url.hostname !== "api.bunny.net",
      );
      expect(serving).toBeGreaterThan(0);
      const cleanup = fake.requests.slice(serving + 1);
      expect(cleanup.map((r) => r.method)).toEqual([
        "DELETE",
        "GET",
        "DELETE",
        "GET",
        "DELETE",
        "GET",
      ]);
      expectUntouched(fake, zones[0].Id);
    });

    it("cleans up with a live request signal after cancellation during propagation and stops", async () => {
      const zones = liveZones();
      const fake = fakeProbe(zones, { answer: () => healthy });
      const controller = new AbortController();
      const sleep = vi.fn(async () => {
        controller.abort();
        throw new DOMException("cancelled", "AbortError");
      });

      expect(
        await run(
          ["probe", "nz", "eu"],
          fake.fetch,
          { BUNNY_API_KEY: "k" },
          {
            signal: controller.signal,
            sleep,
          },
        ).code,
      ).toBe(2);
      expect(sleep).toHaveBeenCalledTimes(1);
      expect(fake.serving).toHaveLength(1);
      expectCleaned(fake, fake.created[0].id, fake.created[0].rule.Guid);
      const install = fake.fetch.mock.calls.findIndex(
        ([, init]) => init?.method === "POST",
      );
      for (const [input, init] of fake.fetch.mock.calls.slice(install + 1)) {
        if (new URL(String(input)).hostname === "api.bunny.net") {
          expect(init?.signal?.aborted).not.toBe(true);
        }
      }
      expectUntouched(fake, zones[0].Id);
    });

    it("does not install or serve when already cancelled", async () => {
      const fake = fakeProbe();
      const controller = new AbortController();
      controller.abort();

      expect(
        await run(
          ["probe", "nz"],
          fake.fetch,
          { BUNNY_API_KEY: "k" },
          {
            signal: controller.signal,
          },
        ).code,
      ).toBe(2);
      expect(fake.created).toEqual([]);
      expect(fake.serving).toEqual([]);
    });

    it("cancellation during a serving request cleans up and stops with exit 2", async () => {
      const zones = liveZones();
      const controller = new AbortController();
      const fake = fakeProbe(zones, {
        answer: () => {
          controller.abort();
          return new DOMException("cancelled while serving", "AbortError");
        },
      });

      expect(
        await run(
          ["probe", "nz", "eu"],
          fake.fetch,
          { BUNNY_API_KEY: "k" },
          {
            signal: controller.signal,
          },
        ).code,
      ).toBe(2);
      expect(fake.serving).toHaveLength(1);
      expectCleaned(fake, fake.created[0].id, fake.created[0].rule.Guid);
      expectUntouched(fake, zones[0].Id);
    });

    it("cleans up if cancellation occurs while the install response is lost", async () => {
      const zones = liveZones();
      const fake = fakeProbe(zones);
      const controller = new AbortController();
      const fetch = vi.fn(
        async (input: string | URL | Request, init?: RequestInit) => {
          const response = await fake.fetch(input, init);
          if (init?.method === "POST") {
            controller.abort();
            throw new DOMException("cancelled after install", "AbortError");
          }
          return response;
        },
      );

      expect(
        await run(
          ["probe", "nz", "eu"],
          fetch,
          { BUNNY_API_KEY: "k" },
          {
            signal: controller.signal,
          },
        ).code,
      ).toBe(2);
      expect(fake.serving).toEqual([]);
      expectCleaned(fake, fake.created[0].id, fake.created[0].rule.Guid);
      expectUntouched(fake, zones[0].Id);
    });

    it.each([REGIONAL_HOSTS.eu, "eu-zone.b-cdn.net"])(
      "rejects nz=%s when its zone carries the eu public hostname, before any writes",
      async (host) => {
        const zones = liveZones();
        const eu = zones.find((z) =>
          z.Hostnames.some((h) => h.Value === REGIONAL_HOSTS.eu),
        )!;
        eu.Hostnames.push({ Value: "eu-zone.b-cdn.net" });
        const fake = fakeProbe(zones);

        expect(
          await rejection(run(["probe", "nz=" + host], fake.fetch).code),
        ).toMatch(/selected for nz.*the eu hostname/);
        expect(fake.created).toEqual([]);
        expect(fake.deleted).toEqual([]);
        expect(fake.serving).toEqual([]);
        expect(fake.requests.every((r) => r.method === "GET")).toBe(true);
        expectUntouched(fake, eu.Id);
      },
    );

    it("uses region=host as a hostname override without changing the selected zone", async () => {
      const zones = liveZones();
      const nz = nzZone(zones);
      nz.Hostnames.push({ Value: "be2169e1-7.b-cdn.net" });
      const fake = fakeProbe(zones);

      expect(
        await run(["probe", "nz=be2169e1-7.b-cdn.net"], fake.fetch).code,
      ).toBe(0);
      expect(fake.created.map((c) => c.id)).toEqual([nz.Id]);
      expect(fake.serving.map((s) => s.host)).toEqual(["be2169e1-7.b-cdn.net"]);
      expect(fake.created[0].rule.Triggers).toEqual([
        expect.objectContaining({
          PatternMatches: [
            `https://be2169e1-7.b-cdn.net/.well-known/ots-error-page-probe/${probeToken(fake.created[0].rule)}/*`,
          ],
        }),
      ]);
      expectCleaned(fake, nz.Id, fake.created[0].rule.Guid);
    });

    it.each(["name", "id"] as const)(
      "selects a Shield zone by env %s and automatically uses its attached b-cdn hostname",
      async (ref) => {
        const zones = liveZones();
        const nz = nzZone(zones);
        nz.Name = "shield-random-name";
        nz.Hostnames = [{ Value: "be2169e1-7.b-cdn.net" }];
        const fake = fakeProbe(zones);

        expect(
          await run(["probe", "nz"], fake.fetch, {
            BUNNY_API_KEY: "k",
            BUNNY_PULL_ZONE_NZ: ref === "name" ? nz.Name : String(nz.Id),
          }).code,
        ).toBe(0);
        expect(fake.created.map((c) => c.id)).toEqual([nz.Id]);
        expect(fake.serving.map((s) => s.host)).toEqual([
          "be2169e1-7.b-cdn.net",
        ]);
        expectCleaned(fake, nz.Id, fake.created[0].rule.Guid);
      },
    );

    it("prefers the attached public hostname even when the env-selected zone also has a b-cdn host", async () => {
      const zones = liveZones();
      const nz = nzZone(zones);
      nz.Hostnames.unshift({ Value: "be2169e1-7.b-cdn.net" });
      const fake = fakeProbe(zones);

      expect(
        await run(["probe", "nz"], fake.fetch, {
          BUNNY_API_KEY: "k",
          BUNNY_PULL_ZONE_NZ: String(nz.Id),
        }).code,
      ).toBe(0);
      expect(fake.serving.map((s) => s.host)).toEqual([REGIONAL_HOSTS.nz]);
    });

    it("combines an env zone reference with an explicit serving hostname", async () => {
      const zones = liveZones();
      const nz = nzZone(zones);
      nz.Hostnames = [
        { Value: "be2169e1-7.b-cdn.net" },
        { Value: "probe.example.net" },
      ];
      const fake = fakeProbe(zones);

      expect(
        await run(["probe", "nz=probe.example.net"], fake.fetch, {
          BUNNY_API_KEY: "k",
          BUNNY_PULL_ZONE_NZ: nz.Name,
        }).code,
      ).toBe(0);
      expect(fake.created.map((c) => c.id)).toEqual([nz.Id]);
      expect(fake.serving.map((s) => s.host)).toEqual(["probe.example.net"]);
    });

    it.each([
      "https://nz.onetimesecret.com",
      "nz.onetimesecret.com/path",
      "nz.onetimesecret.com:443",
      "user@nz.onetimesecret.com",
      "nz.onetimesecret.com?probe=1",
      "nz.onetimesecret.com#fragment",
    ])(
      "rejects invalid hostname override %s before any writes",
      async (host) => {
        const zones = liveZones();
        const nz = nzZone(zones);
        const fake = fakeProbe(zones);
        const { code } = run(["probe", "nz=" + host, "eu"], fake.fetch, {
          BUNNY_API_KEY: "k",
          BUNNY_PULL_ZONE_NZ: String(nz.Id),
        });

        expect(await code).toBe(2);
        expect(fake.created).toEqual([]);
        expect(fake.deleted).toEqual([]);
        expect(fake.serving).toEqual([]);
        expect(fake.requests.some((r) => r.method !== "GET")).toBe(false);
        expectUntouched(fake, zones[0].Id);
      },
    );

    it("rejects a numeric zone ID where a hostname is expected", async () => {
      const fake = fakeProbe();

      expect(
        await rejection(run(["probe", "nz=123"], fake.fetch).code),
      ).toMatch(/region=hostname.*nz=123/);
      expect(fake.fetch).not.toHaveBeenCalled();
    });

    it("requires BUNNY_API_KEY after loading env and before any network request", async () => {
      const fake = fakeProbe();
      const { code, loadEnv } = run(["probe", "nz"], fake.fetch, {});

      expect(await rejection(code)).toMatch(/BUNNY_API_KEY is not set/);
      expect(loadEnv).toHaveBeenCalledTimes(1);
      expect(fake.fetch).not.toHaveBeenCalled();
    });
  });
});
