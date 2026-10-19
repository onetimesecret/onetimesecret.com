// test/unit/lookalike/domains.test.ts

import { describe, expect, it } from "vitest";

import { CANONICAL_ORIGIN, isLookalikeHostname } from "@config/domains";

const fixture = ["onetimesecret.example", "0netimesecret.test"];

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
    expect(isLookalikeHostname(`eu.${real}`, fixture)).toBe(false);
  });
});
