# BunnyCDN Edge Scripts

Two edge scripts run on the onetimesecret.com pull zones. Both decide which
regional domain (`eu`, `uk`, `ca`, `nz`, `us`.onetimesecret.com) a visitor
belongs to, using the same country tables as the client so the edge and the
browser can never disagree.

| File | Runs on | What it does |
| --- | --- | --- |
| `bunnycdn-auth-redirect.ts` | every request | 302s `/signin` and `/signup` to the visitor's regional domain |
| `bunnycdn-country-injection.ts` | origin response, cache MISS only | appends `window.__USER_COUNTRY__` to `<head>` of HTML pages |
| `country.ts` | — | shared, pure helpers used by both (not deployed on its own) |

The auth paths themselves come from `src/utils/authPaths.ts`, shared with the
client-side link rewriter, so the edge and the browser cannot disagree about
which paths are auth entry points.

## Country source

Bunny attaches **`CDN-RequestCountryCode`** to every request at the edge. Both
scripts read it directly from the request object. **No edge rule is required**
— there is no `O-Country-Code` header and nothing to configure beyond the
Vary Cache setting below.

`edge/country.ts` normalizes the value once for both scripts:

- trimmed and uppercased, must match `/^[A-Z]{2}$/`
- `EU` and `AP` are rejected — they are legacy GeoIP *continent* codes that
  geo databases emit in a country field, not ISO 3166-1 countries
- anything rejected is **no signal**
- a real but unmapped country falls through the shared
  `getJurisdictionForCountry()` `|| US` default, exactly as on the client

## bunnycdn-auth-redirect.ts

Auth entry points live on the regional app domains, not on this marketing
site. This script answers them at the edge.

- 302 at the edge — no origin fetch, no interstitial flash
- preserves the full query string (`redirect`, `product`, `interval`, …)
- `Cache-Control: no-store`, so one country's redirect is never served to
  another
- no signal → `eu.onetimesecret.com`
- a country whose region is still `comingSoon` goes to its **live** region
  (`BR` → `us.onetimesecret.com`, `AU` → `nz.onetimesecret.com`).
  `comingSoon` domains are never redirect targets, and nothing routes to
  `eu.onetimesecret.com` on account of a `comingSoon` region
- every other path passes through to the origin untouched

### Blast radius

To serve two paths, this script sits in front of **every** request on the pull
zone: each non-auth request costs an edge-script invocation plus a
`fetch(request)` re-issue, and it is unverified whether a passthrough `fetch`
stays inside the zone's normal cache handling or bypasses it. A regression
here is therefore site-wide, not auth-only.

Scope it at deploy time if the dashboard offers it: Bunny's Edge Scripting
attaches a script to a zone, and where a **path / route trigger** is available
this one should be limited to `/signin*` and `/signup*` rather than `/*`. If
no such trigger exists on the zone, the passthrough is the only option — in
which case the static-asset check in **Verify** is not optional, because it is
the only thing that will tell you the script is not eating the rest of the
site.

The origin still ships `/signin` and `/signup` as client-side regional
redirect pages (`src/pages/{signin,signup}.astro` → `AuthRedirect.astro`) for
traffic that bypasses the CDN, with a no-JS meta-refresh fallback to EU. That
interstitial reproduces the same three steps inline (it cannot import the
helpers through `define:vars`); the parity table in
`test/unit/utils/edgeCountry.test.ts` is what keeps it honest — the `FO`,
`CV` and `GU` rows exist because unmapped-but-real ISO codes are where the
three layers previously disagreed.

## bunnycdn-country-injection.ts

An HTMLRewriter middleware built on the Bunny Edge Scripting SDK:

```ts
BunnySDK.net.http.servePullZone().onOriginResponse((context) => { … });
```

- only `text/html` responses are touched; assets pass through
- appends `<script data-user-country="XX">window.__USER_COUNTRY__="XX";</script>`
  to `<head>`
- **injects nothing when there is no valid country.** It never fabricates a
  default. Client-side `detectUserCountry()` then returns `null` and the app
  falls back to the EU region — the same place the auth redirect sends a
  country-less visitor
- sets no headers at all. HTMLRewriter streams the body and drops
  `Content-Length` itself, and a response `Vary` header does **not** drive
  Bunny's cache key, so setting one would be misleading

### Cache semantics

`onOriginResponse` runs **on cache MISS only**. The transformed HTML is what
gets cached, so the country code is baked into the cached variant.

That is only correct because the pull zone has **Caching → Vary Cache → "User
Country Code" ENABLED**, which puts the country in Bunny's cache key and gives
each country its own variant. Without it, the first visitor's country would be
served to everyone.

### CSP

The injected tag is an inline script. It executes because the site's CSP meta
tag (`src/components/layout/LayoutHead.astro`) includes `script-src
'unsafe-inline'`. If that ever tightens, the inline script stops running — the
`data-user-country` attribute carries the same value and stays readable from
the DOM as a fallback.

## Build

```bash
pnpm edge:build
# → edge/dist/bunnycdn-auth-redirect.js
# → edge/dist/bunnycdn-country-injection.js
```

Each script is bundled to a single self-contained ES module with the shared
country tables inlined, ready to paste into the Bunny dashboard. The two
builds are separate `vite build` invocations (`--mode auth-redirect`,
`--mode country-injection`) so neither produces a shared chunk; an unknown
mode is a hard error. Neither run empties `edge/dist` — each overwrites only
its own file.

The injection bundle keeps its `import * as BunnySDK from
"npm:@bunny.net/edgescript-sdk@0.12.1"` line intact: `npm:` specifiers are
marked external in `edge/vite.config.ts` because the Deno runtime resolves
them at deploy time.

`edge/**` is outside `tsconfig.json`'s `include` (it targets Deno, not the
Astro app), so `pnpm type-check:base` and `pnpm check` skip it.
`tsconfig.edge.json` covers it instead and `pnpm type-check` runs both, which
is what makes `edge/bunny-edgescript.d.ts` an actual check on
`context.request` and `element.append(tag, { html: true })` rather than
editor-only decoration. `pnpm edge:build` still does no type-checking of its
own. The vitest suite over `edge/country.ts`
(`test/unit/utils/edgeCountry.test.ts`) covers the behavior.

## Not verified against a live deploy

The ambient types describe what these scripts assume, not what Bunny
documents. Two assumptions can only be confirmed by deploying:

1. **`onOriginResponse`'s context shape** — assumed `{ request, response }`.
2. **Which registration form each script needs.**
   `bunnycdn-country-injection.ts` registers as SDK middleware
   (`BunnySDK.net.http.servePullZone().onOriginResponse(…)`);
   `bunnycdn-auth-redirect.ts` is a bare `export default { fetch }` with no
   SDK import. At most one of those is the right shape for a
   pull-zone-attached script, and neither `pnpm edge:build` nor the test suite
   can tell you which. The smoke check in **Verify** below is what
   distinguishes "script never registered" from "wrong region".

Untested too: whether one pull zone can host both scripts, and how
auth-redirect's passthrough `fetch(request)` interacts with a zone that also
runs `onOriginResponse`.

## Deploy

Do this for **both** pull zones (apex and www).

1. `pnpm edge:build`
2. Pull Zone → **Caching → Vary Cache → User Country Code** must be
   **enabled** before either script goes on
3. **`bunnycdn-country-injection.js`** — Bunny dashboard → Pull Zones → *your
   zone* → **Edge Scripting**. This one is **SDK middleware**: it registers
   itself by calling `servePullZone().onOriginResponse(…)` at module scope and
   exports nothing. Paste, save, enable.
4. **`bunnycdn-auth-redirect.js`** — same screen. This one is a **standalone
   fetch handler**: `export default { fetch }`, no SDK import. Paste, save,
   enable. If the zone offers a path or route trigger, limit it to `/signin*`
   and `/signup*` — see **Blast radius** above.
5. **Purge the zone.** HTML cached before the Vary setting or before the
   script was enabled has no country variant and no injected tag; it will keep
   being served until it is purged

### Verify

Start with the smoke check — it separates "the script never registered" from
"the script picked the wrong region":

```bash
curl -so /dev/null -w '%{http_code}\n' https://onetimesecret.com/signin
# → 302   the auth-redirect script is live
# → 200   it never registered; you are seeing the origin interstitial
```

A `200` here means step 4 did not take, most likely because the script's
registration form is wrong for this zone (see **Not verified** above). Only
once that returns `302` is the `location` value meaningful:

```bash
curl -sI https://onetimesecret.com/signin | grep -i location
# → location: https://uk.onetimesecret.com/signin

curl -s https://onetimesecret.com/ | grep __USER_COUNTRY__
# → <script data-user-country="GB">window.__USER_COUNTRY__="GB";</script>
# (nothing at all is correct when Bunny has no country for the caller)
```

Then confirm the rest of the zone still behaves — the auth-redirect script
passes every other request through, so this is the check that catches a
passthrough that broke caching or content:

```bash
curl -sI https://onetimesecret.com/etc/img/onetime-logo-md.png \
  | grep -iE 'http/|cdn-cache|content-type|content-length'
# → HTTP/2 200, image/png, a plausible length, and cdn-cache: HIT on a repeat
# A MISS on every repeat means the passthrough is bypassing the zone cache.
```

Re-run from a VPN exit in another country and confirm the values change and
that a repeat request from the first country still returns its own value —
that last check is what proves Vary Cache is on.

## Country to jurisdiction mapping

Defined once in `src/utils/countryToJurisdiction.ts` and bundled into both
edge scripts:

- **EU** — Europe (excluding the UK), Eastern Europe, Russia, Turkey, the
  Caucasus, Central Asia, the Middle East, Africa
- **UK** — United Kingdom, Gibraltar, Guernsey, Isle of Man, Jersey
- **CA** — Canada, Greenland
- **NZ** — Asia-Pacific: Australia, New Zealand, the Pacific, South, East and
  Southeast Asia
- **US** — the Americas, and the default for any unmapped country

Regions marked `comingSoon` in `src/data/ops/jurisdictions.ts` (BR, AU, MX)
are never redirect targets; their countries route to a live region.

## Troubleshooting

**No country code on the page.** Confirm the script is enabled in the
dashboard, then purge — `onOriginResponse` never runs for a cache HIT, so a
page cached before deploy stays untransformed. If it is still missing, Bunny
genuinely has no country for that IP; injecting nothing is the intended
behavior and the client falls back to EU.

**Everyone gets the same country.** Vary Cache → User Country Code is off, or
was turned on without a purge afterwards.

**Assets got slower, or `cdn-cache` never says HIT.** The auth-redirect
script's passthrough `fetch(request)` is in front of them. Scope the script to
`/signin*` and `/signup*` if the zone supports a path trigger; otherwise
disable it and fall back to the origin interstitial, which is correct but
slower for auth entry points.

**Wrong region.** Check the mapping in `src/utils/countryToJurisdiction.ts`,
and remember a persisted region choice in `localStorage`
(`ots:selected-jurisdiction`) deliberately overrides geo on the client — see
`src/utils/regionalAuth.ts`.

## References

- [Bunny Edge Scripting](https://docs.bunny.net/docs/edge-scripting)
- [Bunny Edge Scripting SDK](https://www.npmjs.com/package/@bunny.net/edgescript-sdk)
- [HTMLRewriter API](https://developers.cloudflare.com/workers/runtime-apis/html-rewriter/)
  — Bunny implements the same interface
- [TESTING.md](./TESTING.md) — how to exercise this locally and in production
