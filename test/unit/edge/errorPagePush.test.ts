/**
 * @file errorPagePush.test.ts
 * @description Unit tests for edge/error-page/push.mjs: which pull zones a
 * region resolves to, when a zone counts as out of date, how the zone list is
 * parsed, and what `main` decides to write. The HTTP layer is exercised
 * through an injected fetch so no test reaches the Bunny API.
 *
 * The failure modes worth pinning are the ones that would write to the wrong
 * zone, skip a zone that needed the push, or work from a partial zone list: a
 * hostname on two zones, a region with no zone at all, a zone whose page
 * matches but is disabled, and a paginated response with more pages.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  EXPECTED_CHANGES,
  REGIONAL_HOSTS,
  main,
  normalize,
  parsePullZoneList,
  pickRegions,
  planZone,
  selectRegionalZones,
  unexpectedChanges,
} from "../../../edge/error-page/push.mjs";
import { jurisdictions } from "../../../src/data/ops/jurisdictions";

const PAGE = "<html>\n<body>\n{{status_code}}\n</body>\n</html>";

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
  it("matches the live jurisdictions, so a launched region cannot be missed", () => {
    const live = Object.fromEntries(
      jurisdictions
        .filter((j) => !j.comingSoon)
        .map((j) => [j.identifier.toLowerCase(), j.domain]),
    );

    expect(REGIONAL_HOSTS).toEqual(live);
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

  it("fails loudly when a region has no zone", () => {
    const zones = [zone(2, ["eu.onetimesecret.com"])];

    expect(() => selectRegionalZones(zones, { eu: REGIONAL_HOSTS.eu, ca: REGIONAL_HOSTS.ca }))
      .toThrow(/ca\.onetimesecret\.com/);
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

  it("carries the pre-push zone so the read-back can be diffed against it", () => {
    const s = selected({ ErrorPageEnableCustomCode: true, OriginUrl: "https://origin" });

    expect(planZone(s, PAGE).zone).toBe(s.zone);
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
    const { code, log, loadEnv } = run(["--help"], fetch);

    expect(await code).toBe(0);
    expect(log.mock.calls[0][0]).toMatch(/^Usage:/);
    expect(fetch).not.toHaveBeenCalled();
    expect(loadEnv).not.toHaveBeenCalled();
  });

  it("rejects an unknown flag before doing anything", async () => {
    const { fetch } = fakeBunny([]);
    const { code } = run(["--force"], fetch);

    expect(await rejection(code)).toMatch(/Unknown option\(s\): --force/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fails without BUNNY_API_KEY", async () => {
    const { fetch } = fakeBunny([]);
    const { code, loadEnv } = run([], fetch, {} as { BUNNY_API_KEY: string });

    expect(await rejection(code)).toMatch(/BUNNY_API_KEY is not set/);
    expect(loadEnv).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends the API key on every request", async () => {
    const { fetch } = fakeBunny(liveZones());
    await run([], fetch, { BUNNY_API_KEY: "secret" }).code;

    for (const [, init] of fetch.mock.calls) {
      expect((init as RequestInit).headers).toEqual(expect.objectContaining({ AccessKey: "secret" }));
    }
  });

  it("exits 0 and writes nothing when every zone matches", async () => {
    const { fetch, posts } = fakeBunny(liveZones());
    const { code, log } = run([], fetch);

    expect(await code).toBe(0);
    expect(posts).toEqual([]);
    expect(log).toHaveBeenCalledWith("All zones match regional.html.");
  });

  it("reports drift with exit 1 and writes nothing without --apply", async () => {
    const zones = liveZones();
    zones[1].ErrorPageCustomCode = "<html>old</html>";
    const { fetch, posts } = fakeBunny(zones);
    const { code, log } = run([], fetch);

    expect(await code).toBe(1);
    expect(posts).toEqual([]);
    expect(log).toHaveBeenCalledWith("1 zone(s) differ. Re-run with --apply to push.");
  });

  it("pushes only the drifted zones with --apply, then verifies", async () => {
    const zones = liveZones();
    zones[0].ErrorPageEnableCustomCode = false;
    zones[3].ErrorPageCustomCode = "<html>old</html>";
    const { fetch, posts } = fakeBunny(zones);
    const { code, log } = run(["--apply"], fetch);

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
    const { code } = run(["--apply", "UK"], fetch);

    expect(await code).toBe(0);
    expect(posts.map((p) => p.id)).toEqual([zones[Object.keys(REGIONAL_HOSTS).indexOf("uk")].Id]);
  });

  it("keeps going after a failed zone and exits 2", async () => {
    const zones = liveZones();
    for (const z of zones) z.ErrorPageEnableCustomCode = false;
    const { fetch, posts } = fakeBunny(zones, { failIds: [zones[1].Id] });
    const { code, log, error } = run(["--apply"], fetch);

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
    const { code, error } = run(["--apply"], fetch);

    expect(await code).toBe(2);
    expect(error).toHaveBeenCalledWith(expect.stringMatching(/also changed OriginUrl/));
    // The page itself did land; the exit code is about the collateral change.
    expect(store.get(zones[0].Id)?.ErrorPageCustomCode).toBe(template);
  });
});
