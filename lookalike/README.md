# Lookalike-domain notice site

The second build of this repository. It is served on the lookalike domains
Onetime Secret owns: misspellings and alternate TLDs of onetimesecret.com that
imposter copies of the site used before they were taken down. Each such domain
is registered so it cannot be reused, and it serves one page in four languages
that says, in effect: this is not onetimesecret.com, nothing runs here, here is
how to recognise the real site, and here is what to do if you pasted something
into the copy that used to live here.

```sh
pnpm build:lookalike            # -> dist-lookalike/
pnpm build:verify:lookalike     # fail the build if the output breaks a promise below
pnpm dev:lookalike              # local dev server for the notice pages
```

## Design

**One build, every domain.** The page never knows which domain it is on at
build time. An inline script writes `location.hostname` into the sentence
"You are visiting …" in the browser; without JavaScript the sentence reads
"this address". Adding a domain is DNS plus a hostname on the CDN zone, with no
rebuild and no per-domain content.

**Same brand, separate shell.** `astro.lookalike.config.ts` points `srcDir` at
this directory, so only the pages here are built, while the `@/` and
`@config/` aliases still resolve into `src/` and `config/`. The pages reuse the
styles, fonts, logo, favicons, locale files and i18n helpers of the real site.
They do not reuse `src/layouts/Layout.astro`: it emits a canonical to the real
site (which contradicts noindex), hreflang alternates, a sitemap link, a CSP
that allows the API origin, and relative header and footer links that would
404 here. `layouts/NoticeLayout.astro` is the shell instead.

**Nothing from `public/` by accident.** `publicDir` is `lookalike/public`,
which holds only this site's `robots.txt`. `integration.ts` copies an
allowlist of brand assets (fonts, logo, three favicons) out of the real
site's `public/` after the build. The real site's robots.txt, sitemap.xsl,
llms.txt, webmanifest and error pages never ship. The Vite warnings about
`/fonts/*.woff` not resolving at build time are this arrangement: the fonts
are copied in after Vite has run.

**Every path is the notice.** `pages/404.astro` renders the same page, so a
phishing link already in circulation (`/secret/abc…`) lands on the warning
rather than a dead end. Point the storage zone's custom 404 path at
`/404.html`.

**Translations** live under `web.lookalike` in `src/i18n/ui/*.json`, next to
the real site's strings, so `pnpm i18n:scan` and the harmonize workflow cover
them. The scanner's source glob includes this directory.

## What `scripts/verify-lookalike.mjs` proves on every build

The page's two claims, "nothing is collected" and "indexed nowhere, crawlable
everywhere", are checked against the built HTML rather than asserted once:

- every page has `<meta name="robots" content="noindex">` and no
  `rel="canonical"`, `<link hreflang>` or sitemap link
- no `<form>`, `<iframe>`, external `<script src>`, stylesheet file, or
  network API (`fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`,
  storage writes, cookies) anywhere in the output
- a Content-Security-Policy with `default-src 'none'`, `connect-src 'none'`
  and `form-action 'none'`
- exactly the expected pages (`/`, `/{lang}/` per language, `404.html`), each
  with the right `lang` attribute, the hostname placeholder and a link to
  https://onetimesecret.com
- no `.js`, `.css`, sitemap, llms.txt or webmanifest files, and every other
  file within the allowlist in `integration.ts`
- `robots.txt` allows crawling and advertises no sitemap

## Showing the difference

Below the "how to recognise the real site" list, a collapsed "Show what is
different about this address" link opens a side-by-side comparison of the
real domain and the visited hostname with the differing characters marked.
Nothing about it is written per domain:

- `lookalike/lib/domainDiff.ts` picks the real domain the hostname is closest
  to (canonical first, then the live regional domains), strips the common
  prefix and suffix, diffs what is left character by character, and merges
  runs so an extra "s", an "l" for an "i", a ".net" ending, a missing letter
  or an appended ".evil.example" each come out as one highlighted run.
- `lookalike/components/DomainDiff.astro` renders the result in the browser
  from `location.hostname`. The imposter's characters get the brand colour
  and pulse three times, then stay highlighted; the settled state is also the
  reduced-motion state. The real domain is only dotted-underlined, and the
  prominent copy in the heading is never touched: the reader should learn the
  real address, not a decorated version of it.
- The block stays hidden when there is nothing to teach: on the real site, on
  `localhost`, on an IP address, or when less than 70% of the real domain
  survives in the hostname (`RECOGNISABLE_RATIO`).
- Limits: a punycode hostname (`xn--`) is diffed as its ASCII form, which
  still marks the `xn--` prefix but not the lookalike glyph itself. Dropping
  a leading `www.` is deliberate.

Unit tests: `test/unit/lookalike/domainDiff.test.ts`. The verify script checks
that every page carries the block and that its module script was inlined.

## SEO posture

Noindex, not a redirect, and not a canonical. A crawler can only read a
noindex directive on a page it may fetch, so `robots.txt` allows everything
and a squatted domain's stale index entries get dropped rather than frozen.
A canonical to the real site alongside noindex is a contradiction Google may
resolve either way, so there is none. A wholesale 301 would be the strongest
option for consolidation but would defeat the point of the page.

Set `X-Robots-Tag: noindex` as a response header at the CDN as well; the meta
tag covers HTML and the header covers everything else.

## Deploying

`.github/workflows/deploy-lookalike.yml` builds, runs `build:verify:lookalike`,
uploads `dist-lookalike/` to the storage zone, purges the pull zone and then
runs `build:verify:lookalike:live` against it. It runs on a push to `main`
that touches anything the build reads (this directory, the shared styles,
fonts, brand assets, locale files and config, the verify scripts, the
dependency manifests) and on `workflow_dispatch`. CI builds and verifies the
output on every pull request so a shared-layout change cannot reach `main`
with the notice site broken.

The upload runs with `remove: true`, unlike the main site: the zone holds
nothing but this build, so a file that leaves the build leaves the zone.

### Bunny

1. One storage zone for `dist-lookalike/`, custom 404 path `/404.html`.
2. One pull zone over it. Every lookalike domain, and a wildcard for each
   (`*.example.tld`), is a hostname on this zone with a free SSL certificate.
   Subdomains used by the former copy then land on the notice too.
3. Edge rules on the zone: `X-Robots-Tag: noindex`,
   `Content-Security-Policy: frame-ancestors 'none'` (not enforceable from a
   meta tag), `Strict-Transport-Security`.
4. Bunny Optimizer off, as on every zone for this site (docs/deployment.md).
   Its HTML minifier would rewrite the pages and fail the live check.

### GitHub

A `lookalike` environment with the same secret names as `production` and
`staging`, scoped to the lookalike zones: `STORAGE_NAME`,
`STORAGE_DESTINATION`, `STORAGE_PASSWORD_RW`, `STORAGE_KEY`, `PULL_ZONE_ID`,
`BUNNY_API_KEY`. Plus one variable, `LOOKALIKE_BASE_URL`: an https origin the
pull zone answers on, used by the live check. The zone's `b-cdn.net` hostname
works before any domain points at it.

### What `scripts/verify-lookalike-live.mjs` proves after every deploy

The three things `verify-lookalike` cannot see because they are decided on the
CDN, not in this repository:

- every page and `robots.txt` is served byte for byte as built. Nothing
  rewrites HTML on this zone by design, so any difference is an edge-side
  rewrite (Optimizer, `x-bo-version` in the response) and fails at once.
- an unknown path (`/secret/verify-lookalike-live-<random>`) answers 404
  with the body of `404.html`: the storage zone's custom 404 path is set.
- every response carries the three edge-rule headers above.

A deploy whose zone is missing any of these fails loudly rather than shipping a
notice site that is indexable, framable or dead on a phishing path.

### Not yet automated

A reconciliation script that reads `LOOKALIKE_DOMAINS` in `config/domains.ts`
and reports or applies the hostname set on the pull zone, the way
`edge/error-page/cli.mjs` reports drift. Until then, hostnames are added in
the Bunny dashboard per the checklist below.

## Per-domain checklist

Record the domain in `LOOKALIKE_DOMAINS` (`config/domains.ts`) when it is
acquired; `test/unit/lookalike/domains.test.ts` checks the entry's shape. Then
on the domain's DNS:

- `A`/`CNAME` for the apex and `*` to the pull zone
- `TXT "v=spf1 -all"` at the apex: no host may send mail as this domain
- `TXT "v=DMARC1; p=reject"` at `_dmarc`
- a null MX (`MX 0 .`): the domain receives no mail either
- `CAA` restricting issuance to the CDN's certificate authority
- DNSSEC if the registrar supports it

The domains were used for phishing. Without the mail records they can still
be used for phishing email after they are owned.

## Wording

The copy says the domain is now owned by Onetime Secret, Inc., that it was
used for a copy of the site Onetime Secret did not operate, and that nothing
runs here. It does not characterise the former operator. Keep it that way:
the text is generic across every domain and carries no claim that would need
per-domain evidence.
