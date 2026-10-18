// test/unit/lookalike/domainDiff.test.ts

import { describe, expect, it } from "vitest";

import {
  closestDomain,
  compareHostname,
  diffDomains,
  isRecognisable,
  levenshtein,
  normalizeHostname,
  toSegments,
} from "../../../lookalike/lib/domainDiff";

const REAL = "onetimesecret.com";
const REAL_DOMAINS = [REAL, "eu.onetimesecret.com", "ca.onetimesecret.com"];

describe("diffDomains", () => {
  it("reports an added character as one insertion", () => {
    expect(diffDomains(REAL, "onetimesecrets.com")).toEqual([
      { type: "equal", text: "onetimesecret" },
      { type: "insert", text: "s" },
      { type: "equal", text: ".com" },
    ]);
  });

  it("reports a dropped character as one deletion", () => {
    expect(diffDomains(REAL, "onetimesecret.co")).toEqual([
      { type: "equal", text: "onetimesecret.co" },
      { type: "delete", text: "m" },
    ]);
  });

  it("reports a swapped letter as a replacement", () => {
    expect(diffDomains(REAL, "onetlmesecret.com")).toEqual([
      { type: "equal", text: "onet" },
      { type: "replace", from: "i", to: "l" },
      { type: "equal", text: "mesecret.com" },
    ]);
  });

  it("reports a different ending as a replacement of the whole TLD", () => {
    expect(diffDomains(REAL, "onetimesecret.net")).toEqual([
      { type: "equal", text: "onetimesecret." },
      { type: "replace", from: "com", to: "net" },
    ]);
  });

  it("keeps an appended suffix as a single insertion", () => {
    expect(diffDomains(REAL, "onetimesecret.com.evil.example")).toEqual([
      { type: "equal", text: REAL },
      { type: "insert", text: ".evil.example" },
    ]);
  });

  it("keeps a prepended label as a single insertion", () => {
    expect(diffDomains(REAL, "login.onetimesecret.com")).toEqual([
      { type: "insert", text: "login." },
      { type: "equal", text: REAL },
    ]);
  });

  it("handles a hyphen inserted in the middle", () => {
    expect(diffDomains(REAL, "onetime-secret.com")).toEqual([
      { type: "equal", text: "onetime" },
      { type: "insert", text: "-" },
      { type: "equal", text: "secret.com" },
    ]);
  });

  it("returns one equal run for identical strings", () => {
    expect(diffDomains(REAL, REAL)).toEqual([{ type: "equal", text: REAL }]);
  });
});

describe("toSegments", () => {
  const ops = diffDomains(REAL, "onetlmesecrets.co");

  it("marks what differs on the real side without rewriting it", () => {
    const segments = toSegments(ops, "expected");
    expect(segments.map((s) => s.text).join("")).toBe(REAL);
    expect(
      segments.filter((s) => s.kind === "differs").map((s) => s.text),
    ).toEqual(["i", "m"]);
  });

  it("marks additions, changes and gaps on the visited side", () => {
    const segments = toSegments(ops, "actual");
    expect(segments.map((s) => s.text).join("")).toBe("onetlmesecrets.co");
    expect(segments.map((s) => s.kind)).toEqual([
      "same",
      "changed",
      "same",
      "added",
      "same",
      "gap",
    ]);
  });
});

describe("normalizeHostname", () => {
  it("drops case, whitespace, a trailing dot and a leading www", () => {
    expect(normalizeHostname(" WWW.OneTimeSecrets.COM. ")).toBe(
      "onetimesecrets.com",
    );
  });
});

describe("closestDomain", () => {
  it("picks the regional domain a regional misspelling imitates", () => {
    expect(closestDomain("eu.onetimesecrets.com", REAL_DOMAINS)).toBe(
      "eu.onetimesecret.com",
    );
  });

  it("keeps the first candidate on a tie", () => {
    expect(
      closestDomain("onetimesecret.xyz", [REAL, "onetimesecret.net"]),
    ).toBe(REAL);
    expect(
      closestDomain("onetimesecret.xyz", ["onetimesecret.net", REAL]),
    ).toBe("onetimesecret.net");
  });

  it("returns undefined for no candidates", () => {
    expect(closestDomain("x", [])).toBeUndefined();
  });
});

describe("isRecognisable", () => {
  it("accepts misspellings, other endings and extra labels", () => {
    for (const host of [
      "onetimesecrets.com",
      "onetimesecret.net",
      "0netimesecret.com",
      "onetimesecret.com.evil.example",
    ]) {
      expect(isRecognisable(REAL, host), host).toBe(true);
    }
  });

  it("rejects addresses that do not resemble the real domain", () => {
    for (const host of ["localhost", "127.0.0.1", "example.com", ""]) {
      expect(isRecognisable(REAL, host), host).toBe(false);
    }
  });
});

describe("compareHostname", () => {
  it("compares against the closest real domain", () => {
    const result = compareHostname("CA.onetimesecret.co.", REAL_DOMAINS);
    expect(result?.expected).toBe("ca.onetimesecret.com");
    expect(result?.actual).toBe("ca.onetimesecret.co");
    expect(result?.ops).toEqual([
      { type: "equal", text: "ca.onetimesecret.co" },
      { type: "delete", text: "m" },
    ]);
  });

  it("returns null on the real site itself, including www", () => {
    expect(compareHostname(REAL, REAL_DOMAINS)).toBeNull();
    expect(compareHostname(`www.${REAL}`, REAL_DOMAINS)).toBeNull();
    expect(compareHostname("eu.onetimesecret.com", REAL_DOMAINS)).toBeNull();
  });

  it("returns null for an empty or unrelated hostname", () => {
    expect(compareHostname("", REAL_DOMAINS)).toBeNull();
    expect(compareHostname("localhost", REAL_DOMAINS)).toBeNull();
    expect(compareHostname(REAL, [])).toBeNull();
  });
});

describe("levenshtein", () => {
  it("counts edits over code points", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("é", "e")).toBe(1);
  });
});
