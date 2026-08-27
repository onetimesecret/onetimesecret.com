/// <reference path="./bunny-edgescript.d.ts" />

/**
 * BunnyCDN Edge Script - Country Code Injection
 *
 * Publishes the visitor's country code into every HTML page as
 * `window.__USER_COUNTRY__`, so the client can pick a jurisdiction on first
 * paint without an extra request.
 *
 * How it works:
 * 1. Bunny attaches `CDN-RequestCountryCode` to every edge request — no edge
 *    rule is required; this script reads it straight off `context.request`
 * 2. On a cache MISS the origin HTML is streamed through HTMLRewriter and a
 *    small inline script is appended to <head>
 * 3. The transformed HTML is what Bunny caches
 *
 * Caching:
 * `onOriginResponse` runs on cache MISS only. The pull zone must have
 * Caching → Vary Cache → "User Country Code" ENABLED so each country gets its
 * own cached variant. That setting drives Bunny's cache key; a response
 * `Vary` header does not, so this script never sets one.
 *
 * No-signal contract:
 * When there is no usable country code the script injects NOTHING. It never
 * fabricates a default. Client-side `detectUserCountry()` then returns null
 * and the app falls back to the EU region, which is the same place the
 * auth-redirect edge script sends a country-less visitor.
 *
 * CSP:
 * The injected tag is an inline script. It runs because the site's CSP meta
 * tag (src/components/layout/LayoutHead.astro) includes `script-src
 * 'unsafe-inline'`. The `data-user-country` attribute carries the same value
 * as a fallback that is readable from the DOM without script execution.
 *
 * Build for deployment (bundles the shared country tables):
 *   pnpm edge:build   →  edge/dist/bunnycdn-country-injection.js
 *
 * @see edge/README.md for deployment steps
 * @see https://docs.bunny.net/docs/edge-scripting
 */

import * as BunnySDK from "npm:@bunny.net/edgescript-sdk@0.12.1";

import { COUNTRY_HEADER, buildCountryScriptTag, resolveCountry } from "./country";

BunnySDK.net.http.servePullZone().onOriginResponse((context) => {
  const { request, response } = context;

  // Only HTML carries the app; assets pass through untouched.
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    return;
  }

  const countryCode = resolveCountry(request.headers.get(COUNTRY_HEADER));

  // No signal: inject nothing rather than inventing a country.
  if (!countryCode) {
    return;
  }

  // HTMLRewriter streams the body and drops Content-Length itself, so no
  // header bookkeeping is needed here.
  return new HTMLRewriter()
    .on("head", {
      element(element) {
        element.append(buildCountryScriptTag(countryCode), { html: true });
      },
    })
    .transform(response);
});
