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
| `error-page/regional.html` | regional zones, on error | custom error page pushed by `error-page/cli.mjs` |

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

`edge/dist` holds exactly these two files and nothing else: the build removes
the directory before it starts, `publicDir` is disabled (left on, Vite copies
all of `public/` in beside them, and a paste box is a bad place to be hunting
for the right file), and `edge:verify` fails on any other file it finds there.

Each script is bundled to a single self-contained ES module with the shared
country tables inlined, ready to paste into the Bunny dashboard. The build
ends in `pnpm edge:verify` (`edge/verify-bundles.mjs`), which fails if
`edge/dist` contains anything but the two bundles, if any import specifier
other than `npm:` survived, or if the load-bearing strings (`servePullZone`,
`CDN-RequestCountryCode`) are missing — a bundle that cannot register is the
one failure the runtime turns into a zone-wide outage. The two builds are
separate `vite build` invocations (`--mode auth-redirect`,
`--mode country-injection`) so neither produces a shared chunk; an unknown
mode is a hard error. Neither run empties `edge/dist` (each would delete the
other's output), which is why the script removes the directory up front.

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

> **Paste `edge/dist/*.js`. Never paste a `.ts` file.**
> The sources import `./country` and `../src/utils/authPaths`. Bunny deploys a
> single module with no filesystem beside it, so those specifiers cannot
> resolve, the script dies at load, and **every request on the zone gets a bare
> 400** — see [Deploying the source file](#deploying-the-source-file).

Do this for **both** pull zones (apex and www).

1. `pnpm edge:build` — bundles both scripts and runs `edge:verify`, which fails
   the build if any specifier other than `npm:` survived into the output
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

## Regional error page

`edge/error-page/regional.html` is the custom error page for the five regional
pull zones (`eu`, `ca`, `nz`, `us`, `uk`). Bunny stores **one** custom error
page per pull zone (`ErrorPageCustomCode`) and fills `{{status_code}}` and
`{{status_title}}` at serve time, so a single template covers every status;
the per-status files in `public/bunnycdn_errors/` stay where they are for the
marketing storage zone, where `/bunnycdn_errors/404.html` is a storage-level
feature.

The page is built for the moment the regional origin is down:

- `@font-face` URLs are absolute (`https://onetimesecret.com/fonts/…`). The
  regional origins have no `/fonts/` path, and the marketing zone answers
  those with `access-control-allow-origin: *`, which a cross-origin font load
  requires.
- Links go to `https://onetimesecret.com/` and `https://status.onetimesecret.com/`,
  never to `/`, which on a regional domain is the app that just failed.
- A three-line inline script hides a placeholder that comes through unfilled,
  so a renamed placeholder degrades to a blank line rather than `{{…}}`.
- English only. The regional apps are localized; this page is deliberately not.

`edge/error-page/cli.mjs` keeps the five zones from drifting, through three
pnpm scripts that take the same arguments:

```bash
# BUNNY_API_KEY from the environment, .env.local or .env (declared in
# .env.example); the same precedence as .envrc, with or without direnv
pnpm edge:error-page:push              # report: which zones differ (exit 1 if any)
pnpm edge:error-page:push --apply      # push regional.html to every zone that differs
pnpm edge:error-page:verify            # check every zone; writes nothing
pnpm edge:error-page:deploy            # push then verify, one region at a time
pnpm edge:error-page:probe             # with the origin down: is the page actually served?
pnpm edge:error-page:probe nz=<host>   # probe this hostname for the region (see below)
pnpm edge:error-page:deploy eu uk      # limit to some regions (any command)
pnpm edge:error-page:deploy nz=<zone>  # name the pull zone for a region (name or ID)
```

The region list is read from `src/data/ops/jurisdictions.ts` (live entries
only), the same source as the edge scripts and the client, so launching a
region there is enough for this script to pick up its zone.

A zone is located by its public hostname from `GET /pullzone` by default, so
recreating such a zone needs no change here. A pull zone behind Bunny Shield
cannot be found that way: the public hostname terminates at the shield, and
the zone itself has a generated, non-guessable name and only its
`*.b-cdn.net` hostname. Those zones are named per region, by
`BUNNY_PULL_ZONE_<REGION>` (`BUNNY_PULL_ZONE_NZ=<name or ID>`, declared in
`.env.example`, read from the same sources as `BUNNY_API_KEY`) or by a
`region=zone` argument, which wins over the environment. A region with no
zone, a hostname on two zones, an unknown zone name or ID, or a named zone
that carries another region's hostname aborts before anything is written.

Each push is `POST /pullzone/{id}` with `ErrorPageEnableCustomCode: true` and
the file contents, followed by a `GET` read-back that must match. The
read-back is also diffed against the zone as it was before the push: Bunny
documents that endpoint as a partial update, and the diff turns that
documented claim into a check, since a full-replace would silently reset the
origin, cache rules and Vary settings on a production zone. Any field other
than the two sent (plus Bunny's own bandwidth and charge counters) that
changed is reported as a failure for that zone.

With `push --apply` a failed zone does not stop the run; the remaining zones
are still pushed and the summary lists how many succeeded and failed.
Re-running is idempotent and only touches zones that still differ.

`verify` writes nothing. It reads each zone fresh, applies the same check as
the push read-back (page enabled, content equal to the file), prints the
zone's origin and hostnames for eyeballing, and exits `1` if any zone fails.
When every zone passes it ends by naming the `probe` for those regions, the
one check that needs the origin down.

`deploy` is push and verify for one region at a time, in the order given:
read the zone fresh, push if it differs, verify, then the next region. It
stops at the first failure, including a collateral change caught by the
read-back diff, and says which regions it did not reach. A push that
misbehaves on one production zone is therefore never repeated on the next.
Zones already up to date are only verified. This is the command to run after
changing `regional.html`.

`probe` is the serving check. It fetches `https://<host>/` once per region,
straight through the pull zone with no API key and no zone lookup, and
classifies the answer: a 2xx or 3xx is the origin answering and proves
nothing about the page, a 5xx carrying the template's `<title>` with every
placeholder filled is the custom page, any other 5xx is not. It exits `0`
only when every region served the page, so a run with the origin up fails
and says so instead of passing by accident. Bunny serves the custom page
only for errors it generates itself (origin unreachable or timed out); a
`500` from the app passes through untouched. So the probe means something
only with the origin down, or its `OriginUrl` temporarily pointed at a
closed port (restore it in the same session). A public hostname that does
not route through the pull zone yet (`nz.onetimesecret.com` is a CNAME to
its origin while Bunny Shield is pending) never reaches the page; probe the
zone's own hostname instead, `nz=be2169e1-7.b-cdn.net`, which `verify`
prints.

Exit codes for all four: `0` clean, `1` drift found by `push` without
`--apply`, a zone failed `verify`, or `probe` did not see the page from
every region, `2` a push failed, `deploy` stopped, or the script could not
run.

`test/unit/edge/errorPageCli.test.ts` covers zone resolution, drift
planning, the zone-list parsing, the read-back diff, the probe's
classification and, through an injected `fetch`, all four commands end to
end.

### Checking a zone by hand

For the day the script is not trusted, the same checks against the API
directly. `ZONE` is the pull zone ID, `HOST` the region's public hostname
(both are in the `verify` output).

```bash
ZONE=6421160 HOST=nz.onetimesecret.com

# What Bunny stores for the zone (BUNNY_API_KEY in the shell)
curl -s -H "AccessKey: $BUNNY_API_KEY" -H "Accept: application/json" \
  "https://api.bunny.net/pullzone/$ZONE" \
  | jq '{enabled: .ErrorPageEnableCustomCode, origin: .OriginUrl, hosts: [.Hostnames[].Value]}'

# The stored page against the file in git. A diff of only a trailing
# newline is fine; anything else is drift.
curl -s -H "AccessKey: $BUNNY_API_KEY" -H "Accept: application/json" \
  "https://api.bunny.net/pullzone/$ZONE" \
  | jq -r '.ErrorPageCustomCode' | diff - edge/error-page/regional.html && echo match
```

In the dashboard: dash.bunny.net, CDN, the zone, its custom error page
setting shows the same toggle and HTML.

Seeing the page served is what `probe` does; by hand it is one request
with the origin down. The homepage of the app also says "Onetime Secret",
so the title is the line to look for, together with the status:

```bash
curl -sS -w 'status %{http_code}\n' "https://$HOST/" | grep -E 'Service Error|^status '
```

A `status 502` or `504` with a `Service Error` title line is the custom
page. A `status 200` with no title line is the app, and proves nothing.

Not verified against a live zone: the exact set of statuses Bunny routes
through the custom page (origin-unreachable 502/504 and Bunny's own errors
are the documented case; a `500` the origin itself returns passes through
untouched), and whether `{{status_title}}` is the placeholder Bunny's editor
currently offers alongside `{{status_code}}`. The hide script above is the
guard for the second.

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

### Deploying the source file

**Symptom:** every request on the zone returns `400` with a zero-length body,
in 0ms, uniformly across all paths and both hostnames, while `PullSuccess` is
still `True`. The edge script log shows, once per request:

```
Unknown: disallowed module reference; specifier=./country, referrer=file:///mod.ts
```

**Cause:** a `.ts` source was pasted into the dashboard instead of the built
bundle. `file:///mod.ts` is the single module Bunny deploys; `./country` has
nothing to resolve against. The script fails at load, before it handles a
request, so the 400 is not something the script code can be responsible for.

This happened on 2026-08-27 and took the `.dev` zone down for hours. The
dashboard editor uploads exactly one file and will never resolve a relative
import — pasting source can only ever fail this way.

**Recovery:**

1. Detach the script from the zone (`MiddlewareScriptId: -1`) — the site comes
   back immediately
2. `pnpm edge:build`
3. Paste `edge/dist/<name>.js`, save, enable
4. **Purge the zone.** `CacheErrorResponses: true` plus a 12-hour max-age
   override means cached 400s outlive the fix

**Prevention:** `pnpm edge:build` now ends in `pnpm edge:verify`, which rejects
any output containing a specifier that is not `npm:`. Run `pnpm edge:verify`
before pasting if you are deploying a bundle you did not just build.

**Enable zone logging.** These zones ship with `EnableLogging: false` and no
log forwarding, which is why the failure above was found by symptom hours
later instead of from the error at the moment it happened.


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
