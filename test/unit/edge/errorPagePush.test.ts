/**
 * @file errorPagePush.test.ts
 * @description Unit tests for the pure planning half of
 * edge/error-page/push.mjs: which pull zones a region resolves to, and when a
 * zone counts as out of date. The HTTP half is a thin wrapper over fetch and
 * is exercised by running the script against the account.
 *
 * The failure modes worth pinning are the ones that would write to the wrong
 * zone or skip a zone that needed the push: a hostname on two zones, a region
 * with no zone at all, and a zone whose page matches but is disabled.
 */

import { describe, expect, it } from "vitest";
import {
  REGIONAL_HOSTS,
  normalize,
  pickRegions,
  planZone,
  selectRegionalZones,
} from "../../../edge/error-page/push.mjs";

const PAGE = "<html>{{status_code}}</html>";

function zone(id: number, hosts: string[], extra: Record<string, unknown> = {}) {
  return {
    Id: id,
    Name: `zone-${id}`,
    Hostnames: hosts.map((Value) => ({ Value })),
    ...extra,
  };
}

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

  it("ignores CRLF and surrounding whitespace differences", () => {
    const plan = planZone(
      selected({
        ErrorPageEnableCustomCode: true,
        ErrorPageCustomCode: `\r\n${PAGE.replace("\n", "\r\n")}\r\n`,
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

describe("pickRegions", () => {
  it("returns every region when none are named", () => {
    expect(pickRegions([])).toEqual(REGIONAL_HOSTS);
  });

  it("narrows to the named regions in the order given", () => {
    expect(Object.keys(pickRegions(["uk", "eu"]))).toEqual(["uk", "eu"]);
  });

  it("rejects a region that has no live zone", () => {
    expect(() => pickRegions(["br"])).toThrow(/Unknown region\(s\): br/);
  });
});

describe("normalize", () => {
  it("treats null as empty", () => {
    expect(normalize(null)).toBe("");
  });
});
