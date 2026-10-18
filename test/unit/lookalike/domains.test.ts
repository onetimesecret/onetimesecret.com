// test/unit/lookalike/domains.test.ts

import { describe, expect, it } from "vitest";

import {
  CANONICAL_ORIGIN,
  isLookalikeHostname,
  isStagingHostname,
  LOOKALIKE_DOMAINS,
  type LookalikeDomain,
} from "@config/domains";

const fixture: LookalikeDomain[] = [
  { domain: "onetimesecret.example", acquired: "2026-01-01" },
  { domain: "0netimesecret.test", acquired: "2026-02-01", note: "digit zero" },
];

describe("isLookalikeHostname", () => {
  it("matches an owned domain exactly and as a parent of subdomains", () => {
    expect(isLookalikeHostname("onetimesecret.example", fixture)).toBe(true);
    expect(isLookalikeHostname("www.onetimesecret.example", fixture)).toBe(
      true,
    );
    expect(isLookalikeHostname("a.b.0netimesecret.test", fixture)).toBe(true);
  });

  it("normalizes case, whitespace and a trailing dot", () => {
    expect(isLookalikeHostname("  OneTimeSecret.Example. ", fixture)).toBe(
      true,
    );
  });

  it("does not match a hostname that merely contains an owned domain", () => {
    // The spoofing shape isStagingHostname() guards against.
    expect(
      isLookalikeHostname("onetimesecret.example.attacker.com", fixture),
    ).toBe(false);
    expect(isLookalikeHostname("notonetimesecret.example", fixture)).toBe(
      false,
    );
  });

  it("never matches the real site", () => {
    const real = new URL(CANONICAL_ORIGIN).hostname;
    expect(isLookalikeHostname(real, fixture)).toBe(false);
    expect(isLookalikeHostname(real)).toBe(false);
    expect(isLookalikeHostname(`eu.${real}`)).toBe(false);
  });
});

describe("LOOKALIKE_DOMAINS registry", () => {
  const real = new URL(CANONICAL_ORIGIN).hostname;

  it("holds bare lowercase hostnames with no scheme, path or trailing dot", () => {
    for (const { domain } of LOOKALIKE_DOMAINS) {
      expect(domain).toMatch(
        /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/,
      );
    }
  });

  it("dates each acquisition as YYYY-MM-DD", () => {
    for (const { domain, acquired } of LOOKALIKE_DOMAINS) {
      expect(acquired, domain).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(acquired)), domain).toBe(false);
    }
  });

  it("has no duplicates and never lists the real or staging hostnames", () => {
    const domains = LOOKALIKE_DOMAINS.map((d) => d.domain);
    expect(new Set(domains).size).toBe(domains.length);
    for (const domain of domains) {
      expect(domain === real || domain.endsWith(`.${real}`), domain).toBe(
        false,
      );
      expect(isStagingHostname(domain), domain).toBe(false);
    }
  });
});
