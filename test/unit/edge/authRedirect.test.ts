/**
 * @file authRedirect.test.ts
 * @description Unit tests for the BunnyCDN auth-redirect edge script entry
 * point (edge/bunnycdn-auth-redirect.ts) — the `fetch` handler itself, not
 * the shared helpers it calls.
 *
 * test/unit/utils/edgeCountry.test.ts pins the country → domain mapping. What
 * is untested without this file is everything the entry point adds on top of
 * it: which paths it claims, how it assembles the Location URL, that the 302
 * is never cached, and that anything unexpected falls back to the origin
 * rather than breaking /signin. Those are the parts that cost real logins when
 * they regress, and they need no Bunny runtime — only a Request and a stubbed
 * global fetch.
 *
 * The sibling country-injection entry point is covered separately with a
 * vitest alias for Bunny's SDK and a fake `HTMLRewriter`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import authRedirect from "../../../edge/bunnycdn-auth-redirect";
import { COUNTRY_HEADER } from "../../../edge/country";

/** What the stubbed origin returns, so passthrough is identifiable by identity. */
const ORIGIN_RESPONSE = new Response("origin", { status: 200 });

let originFetch: ReturnType<typeof vi.spyOn>;

/** Builds an edge request, optionally carrying Bunny's country header. */
function edgeRequest(path: string, country?: string): Request {
  const headers = country ? { [COUNTRY_HEADER]: country } : undefined;
  return new Request(`https://onetimesecret.com${path}`, { headers });
}

beforeEach(() => {
  // The handler calls bare `fetch`, so the global is the origin seam.
  originFetch = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => ORIGIN_RESPONSE.clone());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("auth path redirects", () => {
  it.each(["/signup", "/signin"])(
    "302s %s without contacting the origin",
    async (path) => {
      const response = await authRedirect.fetch(edgeRequest(path, "GB"));

      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe(
        `https://uk.onetimesecret.com${path}`,
      );
      expect(originFetch).not.toHaveBeenCalled();
    },
  );

  it("marks the redirect no-store", async () => {
    // One country's redirect must never be cached and served to another.
    const response = await authRedirect.fetch(edgeRequest("/signin", "GB"));

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it.each(["/signin/", "/signin//", "/signup/"])(
    "normalizes the trailing slash on %s",
    async (path) => {
      const response = await authRedirect.fetch(edgeRequest(path, "GB"));

      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe(
        `https://uk.onetimesecret.com${path.replace(/\/+$/, "")}`,
      );
    },
  );

  it("preserves the query string", async () => {
    // redirect/product/interval ride along to the regional signup form.
    const request = edgeRequest("/signup?product=team&interval=year", "GB");
    const response = await authRedirect.fetch(request);

    expect(response.headers.get("Location")).toBe(
      "https://uk.onetimesecret.com/signup?product=team&interval=year",
    );
  });

  it("appends no query string when the request has none", async () => {
    const response = await authRedirect.fetch(edgeRequest("/signup", "GB"));

    expect(response.headers.get("Location")).toBe(
      "https://uk.onetimesecret.com/signup",
    );
  });
});

describe("country header drives the region", () => {
  it.each([
    ["US", "us.onetimesecret.com"],
    ["GB", "uk.onetimesecret.com"],
    // Legacy GeoIP continent code and no header at all: both are "no signal".
    ["EU", "eu.onetimesecret.com"],
    [undefined, "eu.onetimesecret.com"],
  ])("sends %s to %s", async (country, domain) => {
    const response = await authRedirect.fetch(edgeRequest("/signin", country));

    expect(response.headers.get("Location")).toBe(`https://${domain}/signin`);
  });
});

describe("passthrough", () => {
  it.each(["/pricing", "/etc/img/logo.png", "/", "/signing-key"])(
    "hands %s to the origin untouched",
    async (path) => {
      const request = edgeRequest(path, "GB");
      const response = await authRedirect.fetch(request);

      // Identity, not equality: `Request` exposes everything through prototype
      // getters, so `toHaveBeenCalledWith` sees no own properties and passes
      // for a handler that re-issued a rewritten request to another origin.
      expect(originFetch).toHaveBeenCalledTimes(1);
      expect(originFetch.mock.calls[0]?.[0]).toBe(request);
      expect(response.status).toBe(200);
      expect(response.headers.get("Location")).toBeNull();
    },
  );
});

describe("failure fallback", () => {
  it("falls back to the origin when resolving the region throws", async () => {
    // Throwing from the header read puts the failure *after* the auth-path
    // check, which is the only way to tell the catch branch apart from plain
    // passthrough: an unguarded handler would reject instead of serving.
    const request = edgeRequest("/signin", "GB");
    vi.spyOn(request.headers, "get").mockImplementation(() => {
      throw new Error("country lookup exploded");
    });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const response = await authRedirect.fetch(request);

    expect(originFetch).toHaveBeenCalledTimes(1);
    expect(originFetch.mock.calls[0]?.[0]).toBe(request);
    expect(response.status).not.toBe(302);
    expect(response.headers.get("Location")).toBeNull();
    expect(consoleError).toHaveBeenCalled();
  });
});
