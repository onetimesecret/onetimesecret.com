# Testing the edge scripts

How to exercise country detection and regional auth redirects locally, in
unit tests, and against production. See [README.md](./README.md) for what the
scripts do and how they deploy.

## What is actually testable where

Most of the Bunny runtime (`servePullZone`, `HTMLRewriter`, `npm:` specifiers)
does not exist in Node, but the auth-redirect script needs none of it: its
`fetch` handler takes a `Request` and calls the global `fetch`, both of which
Node has. It is executed directly in the suite.

The injection script imports `npm:@bunny.net/edgescript-sdk@0.12.1`, which
vite's import analysis rejects at transform time — before `vi.mock` gets a
chance. The vitest config aliases that specifier to a small SDK stub, and the
test supplies a fake `HTMLRewriter`, so the registered origin-response handler
can also be executed directly.

| Layer | Where | How |
| --- | --- | --- |
| Country normalization, region mapping | `edge/country.ts` | vitest, `test/unit/utils/edgeCountry.test.ts` |
| Auth-redirect entry point | `edge/bunnycdn-auth-redirect.ts` | vitest, `test/unit/edge/authRedirect.test.ts` |
| Auth path list | `src/utils/authPaths.ts` | shared with the client; covered from both sides |
| Client link rewriting | `src/utils/regionalAuth.ts` | vitest, `test/unit/utils/regionalAuth.test.ts` |
| Client region resolution | `src/stores/jurisdictionStore.ts` | vitest, `test/unit/stores/` |
| Injection entry point | `edge/bunnycdn-country-injection.ts` | vitest, `test/unit/edge/countryInjection.test.ts` |
| Bundling | `pnpm edge:build` | inspect `edge/dist/*.js` |
| Injection on a real response | production | `curl` from a VPN exit |

## Local development

The dev server is not behind Bunny, so no country is ever injected. Set the
global by hand in the browser console and reload:

```javascript
window.__USER_COUNTRY__ = 'GB';   // → UK region
window.__USER_COUNTRY__ = 'JP';   // → NZ region
window.__USER_COUNTRY__ = 'BR';   // → US region
delete window.__USER_COUNTRY__;   // → no signal, falls back to EU
```

A persisted region choice beats the injected country, so clear it when
testing geo:

```javascript
localStorage.removeItem('ots:selected-jurisdiction');
```

Checklist worth walking once:

- [ ] Header and mobile-menu Sign in / Sign up point at the expected domain
- [ ] With no country and no stored choice, those links stay **relative**
      (`/signin`) and the interstitial page redirects to EU
- [ ] A stored choice overrides the injected country everywhere
- [ ] Changing the region in the pricing selector moves the header and mobile
      menu links too, in the same page load
- [ ] `data-auth-redirect` links carry a root-relative `redirect` parameter,
      unless the server already rendered one (pages passing `authRedirect`)

## Unit tests

```bash
pnpm test                                              # everything
pnpm test -- test/unit/utils/edgeCountry.test.ts       # edge helpers only
pnpm test -- test/unit/edge/                           # edge entry points
```

`test/unit/edge/authRedirect.test.ts` drives the `fetch` handler itself: which
paths it claims, how it builds the `Location`, that the 302 is `no-store`, and
that a throw falls back to the origin rather than breaking `/signin`. The
origin seam is a spy on `globalThis.fetch`.

`test/unit/edge/countryInjection.test.ts` captures the registered
origin-response handler through the SDK stub and verifies passthrough and
country-tag injection with a fake `HTMLRewriter`.

`test/unit/utils/edgeCountry.test.ts` is table-driven and asserts the property
that matters: for every input, the domain the edge redirects to equals the
domain the client resolves. Add a row there rather than a new assertion pair
when the mapping changes.

Cases the table pins down:

| Header value | Domain | Why |
| --- | --- | --- |
| absent, `''`, `'U'`, `'USA'` | `eu.` | no signal → default region |
| `'EU'`, `'AP'` (any case) | `eu.` | legacy GeoIP continent codes, not countries |
| `'de'`, `'DE'` | `eu.` | normalization is case-insensitive |
| `'GB'` | `uk.` | UK is its own region, not EU |
| `'ZZ'` | `us.` | real-shaped but unmapped → shared `|| US` default |
| `'BR'`, `'AU'` | `us.`, `nz.` | `comingSoon` regions are never targets |

## Build verification

`pnpm edge:build` does not type-check and esbuild will happily emit a broken
script, so check the output rather than the exit code:

```bash
pnpm edge:build
head -1 edge/dist/bunnycdn-country-injection.js
# → import * as BunnySDK from "npm:@bunny.net/edgescript-sdk@0.12.1";

grep -c "servePullZone" edge/dist/bunnycdn-country-injection.js   # → 1
grep -c "CDN-RequestCountryCode" edge/dist/bunnycdn-auth-redirect.js  # → 1
```

The injection entry's only top-level statement is a side-effect call, so
confirming `servePullZone` survived tree-shaking is the check that matters.

## Production

After deploying (see README.md — paste into **both** pull zones, enable Vary
Cache → User Country Code, then **purge**):

```bash
# 1. Injection
curl -s https://onetimesecret.com/ | grep __USER_COUNTRY__
# → <script data-user-country="GB">window.__USER_COUNTRY__="GB";</script>

# 2. Auth redirect
curl -sI https://onetimesecret.com/signin | grep -i "location\|cache-control"
# → location: https://uk.onetimesecret.com/signin
# → cache-control: no-store

# 3. Query string survives
curl -sI "https://onetimesecret.com/signup?product=team&interval=year" \
  | grep -i location
# → location: https://uk.onetimesecret.com/signup?product=team&interval=year

# 4. Passthrough
curl -sI https://onetimesecret.com/pricing | head -1
# → HTTP/2 200
```

Then repeat 1 and 2 from a VPN exit in another country. Two things to confirm:

- the values change with the exit location
- a second request from the **first** country still returns the first
  country's value

That second point is the only real test of Vary Cache. If country A's page
starts coming back for country B, Vary Cache is off or the zone was not purged
after enabling it.

## Edge cases

| Scenario | Expected |
| --- | --- |
| Bunny has no country for the IP | nothing injected; client falls back to EU; `/signin` 302s to EU |
| Country maps to a `comingSoon` region | live region (never `br.`/`au.`/`mx.`) |
| Non-HTML response | passes through untouched |
| Cache HIT | `onOriginResponse` does not run; cached HTML already carries its country |
| CDN bypassed entirely | no injection; `/signin` and `/signup` interstitials resolve client-side |
| JavaScript disabled | interstitial meta-refresh sends the visitor to EU |
| `localStorage` unavailable | persisted choice is skipped, geo is used |

## Troubleshooting

**Country code not detected.** Check for a cache HIT first (purge, then
retry). Then confirm the script is enabled on the zone. Then accept that Bunny
may simply have no country for the caller — injecting nothing is correct.

**Wrong region.** Check `localStorage['ots:selected-jurisdiction']` before
blaming geo; an explicit choice is meant to win. Otherwise check the mapping
in `src/utils/countryToJurisdiction.ts`.

**Links are relative in production.** That means neither a stored choice nor a
country was available. The interstitial handles it; if it happens for every
visitor, the injection script is not running.
