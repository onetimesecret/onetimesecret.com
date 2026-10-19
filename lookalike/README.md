# Lookalike-domain notice site

The second build of this repository. It is served on the lookalike domains
Onetime Secret owns: misspellings and alternate TLDs of onetimesecret.com. Each
such domain serves one page in four languages that says, in effect: this is
not onetimesecret.com, this is a notice rather than the secret-sharing service,
here is how to recognise the official site, and here is what to do if you may
have entered sensitive information on any unofficial domain.

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
site's `public/` after the build, and serves the same allowlist under
`pnpm dev:lookalike`, where Astro would otherwise serve `publicDir` alone.
The real site's robots.txt, sitemap.xsl, llms.txt, webmanifest and error
pages never ship. The Vite warnings about `/fonts/*.woff` not resolving at
build time are this arrangement: the fonts are copied in after Vite has run.

**Only the CSS the page uses.** `styles/tailwind.css` imports the real site's
two stylesheets with `source(none)` and adds this directory back as the only
`@source`. Imported directly, Tailwind scans the whole repository and inlines
every utility the real site uses into each page, about 190 KB of CSS; scoped,
a page is about 35 KB in total. The theme, preflight and custom variants are
the real site's, unchanged.

**The CSP is the production one, except under `astro dev`.** There, Vite
serves the comparison module and its client as files and hot reload needs a
WebSocket, so `NoticeLayout.astro` adds `'self'` and `ws:` to the policy in
development only. `verify-lookalike` checks the built pages for the
production directives.

**Every path is the notice.** `pages/404.astro` renders the same page, so a
link to a deep path (`/secret/abc…`) lands on the warning rather than a dead
end. Point the storage zone's custom 404 path at
`/404.html`.

**Translations** live under `web.lookalike` in `src/i18n/ui/*.json`, next to
the real site's strings, so `pnpm i18n:scan` and the harmonize workflow cover
them. The scanner's source glob includes this directory.

## What `scripts/verify-lookalike.mjs` checks on every build

These regression checks enforce restricted page output and noindex directives.
They do not establish that no data is collected: the CDN receives requests,
including paths and query strings. CDN logging and retention require a separate
operational review. Noindex instructs compliant crawlers; it does not guarantee
removal from every index.

- every page has `<meta name="robots" content="noindex">` and no
  `rel="canonical"`, `<link hreflang>` or sitemap link
- no `<form>`, `<iframe>`, external `<script src>`, stylesheet file, or
  network API (`fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`,
  storage writes, cookies) anywhere in the output
- a Content-Security-Policy with `default-src 'none'`, `connect-src 'none'`
  and `form-action 'none'`
- exactly the expected pages (`/`, `/{lang}/` per language, `404.html`), each
  with the right `lang` attribute and the hostname placeholder; every anchor
  is a local language-switch link, never an outbound link
- the h2 headings appear in task order (link recipient, secret sender,
  exposure, then "What is this page?"), the recipient and exposure guidance
  is visible without JavaScript and outside any `<details>`, no `<details>`
  starts open, the language navigation precedes the notice, and the large
  official address reads exactly the canonical hostname
- no `.js`, `.css`, sitemap, llms.txt or webmanifest files, and every other
  file within the allowlist in `integration.ts`: a listed file exactly, or
  anything under a listed directory (`favicon.svg.bak` does not pass)
- `robots.txt` allows crawling and advertises no sitemap

The structural checks parse each page with `jsdom`, a devDependency. CI and
the deploy workflow install dev dependencies (`pnpm install
--frozen-lockfile`); the gate does not run after `pnpm install --prod`.

## Showing the difference

Under "What is this page?", a collapsed "Compare this domain with the real
one" disclosure opens a side-by-side comparison of the real domain and the
visited hostname with the differing characters marked. Nothing about it is
written per domain:

- `lookalike/lib/domainDiff.ts` picks the real domain the hostname is closest
  to (canonical first, then the live regional domains), strips the common
  prefix and suffix, diffs what is left character by character, and merges
  runs so an extra "s", an "l" for an "i", a ".net" ending, a missing letter
  or an appended ".evil.example" each come out as one highlighted run.
- `lookalike/components/DomainDiff.astro` renders the result in the browser
  from `location.hostname`. The visited address's characters get the brand colour
  and pulse three times, then stay highlighted; the settled state is also the
  reduced-motion state. The real domain is only dotted-underlined, and the
  prominent copy in the heading is never touched: the reader should learn the
  real address, not a decorated version of it.
- Screen readers hear the visited address's differences as words instead of
  highlights, spelled letter by letter ("extra: s", "l instead of i",
  "missing: m"; `web.lookalike.diff.sr*`), since a misspelled domain read
  aloud sounds like the real one.
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
and a domain's stale index entries get dropped rather than frozen.
A canonical to the real site alongside noindex is a contradiction Google may
resolve either way, so there is none. A wholesale 301 would be the strongest
option for consolidation but would defeat the point of the page.

The response headers that back this up are edge rules on the pull zone; see
"Response headers" under Deploying.

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
nothing but this build, so a file that leaves the build leaves the zone. For
the same reason runs queue rather than cancel each other: a run cancelled
between the removal and the end of the upload would leave the domains serving
nothing.

### Bunny

1. One storage zone for `dist-lookalike/`, custom 404 path `/404.html`.
2. One pull zone over it. Every lookalike domain, and a wildcard for each
   (`*.example.tld`), is a hostname on this zone with a free SSL certificate.
   Any subdomain then lands on the notice too.
3. Edge rules setting the response headers below on every response, not
   only HTML.
4. Bunny Optimizer off, as on every zone for this site (docs/deployment.md).
   Its HTML minifier would rewrite the pages and fail the live check.

### Response headers

**Current policy:** all pages emit `noindex, nofollow`, and the live verification
requires `X-Robots-Tag: noindex` on every response. Keep that header on all paths
until an indexing-policy change is implemented and deployed together.

**Proposed root exception (not implemented):** the policy in
`docs/.lookalike-domain-defense-playbook.txt` would allow indexing of the roots
so a domain search may surface the notice, while other paths retain noindex.
The table and matching rules below describe that proposal, not the current
configuration. Headers apply to fonts, images and the 404 fallback as well as pages.

| Header                      | Value                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `X-Robots-Tag`              | `noindex, follow` on every path except the roots `/` and `/{lang}/`, which get none |
| `Content-Security-Policy`   | `frame-ancestors 'none'; form-action 'none'; connect-src 'none'; base-uri 'none'`   |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload`                                      |
| `Referrer-Policy`           | `no-referrer`                                                                       |
| `Cache-Control`             | `public, max-age=300, stale-while-revalidate=86400, stale-if-error=604800`          |
| `Link`                      | not set at all; a `rel="canonical"` by header is as wrong as one in the page        |

`X-Robots-Tag` is one rule, not a catch-all plus an override: Bunny's Set
Response Header action is cumulative, so a second matching rule adds a
header and cannot remove the first. The rule sets `X-Robots-Tag` to
`noindex, follow` with a Request URL trigger set to **Match None** and one
anchored Lua pattern per root (the trigger path includes the scheme and
host, `*` crosses slashes, and the query string is ignored):

```text
pattern:^https://[^/]+/$
pattern:^https://[^/]+/de/$
pattern:^https://[^/]+/en/$
pattern:^https://[^/]+/es/$
pattern:^https://[^/]+/fr/$
```

Listing the languages rather than `[a-z][a-z]` keeps a two-letter phishing
path like `/id/` out of the exception. Add a line when a language is added.
Check with `curl -sI` that `/` and `/en/` have no `X-Robots-Tag` and that
`/en`, `/favicon.ico`, `/404.html` and `/secret/anything/` do. The CSP header carries only directives the page's meta tag cannot
(`frame-ancestors`) or that restate the "accepts no data" claim. It has no
`default-src 'self'`: every delivered policy is enforced, so a header
`default-src 'self'` would block the inline hostname script and inline
styles that the meta tag's `'unsafe-inline'` allows. `includeSubDomains` is
right because the wildcard hostname lands every subdomain on this zone;
submit each domain to the HSTS preload list once it is stable.
`stale-if-error` keeps the notice served if the storage zone is unreachable.

Status codes: the roots answer 200, every unknown path answers 404 with the
notice as its body and `X-Robots-Tag: noindex`. Never redirect from a
lookalike to onetimesecret.com, not even for deep links: a redirect hands the
phishing link's click to the real site with no warning, and an
attacker-chosen path could launder a link through it.

The checks in this repository have not caught up with the root exception:
`verify-lookalike` requires a `noindex` meta tag on every page and
`verify-lookalike-live` requires `X-Robots-Tag: noindex` on every response,
roots included. To allow root indexing, update `layouts/NoticeLayout.astro`,
both gates and the edge rules together. Omitting the root header does not
override its existing noindex meta tag. Reconcile `nofollow` in the meta tag
with the proposed `follow` header at the same time. Indexing remains a crawler
decision.

### GitHub

A `lookalike` environment with the same secret names as `production` and
`staging`, scoped to the lookalike zones: `STORAGE_NAME`,
`STORAGE_DESTINATION`, `STORAGE_PASSWORD_RW`, `STORAGE_KEY`, `PULL_ZONE_ID`,
`BUNNY_API_KEY`. Plus two variables:

- `STORAGE_ENDPOINT`: the storage zone's API hostname from its FTP & API
  Access page, for example `storage.bunnycdn.com` (Falkenstein) or
  `ny.storage.bunnycdn.com` (New York). The upload action assumes
  Falkenstein when it is not given; against any other region the upload
  fails with 401. The workflow refuses to run without it.
- `LOOKALIKE_BASE_URL`: an https origin the pull zone answers on, used by the
  live check. The zone's `b-cdn.net` hostname works before any domain points
  at it.

And one secret no workflow reads yet, `LOOKALIKE_DOMAINS`: the lookalike
domains not listed in `LOOKALIKE_DOMAINS` in `config/domains.ts`, one bare
lowercase hostname per line (no scheme, path, trailing dot or commas). The
repository lists only the obvious ones, such as `onetimesecret.co`; the rest
stay in the secret so the full inventory is not advertised. A variable would
not do: it is printed unmasked in the public Actions log. A saved secret
cannot be read back, so changing it means entering its whole list again:

```sh
gh secret set LOOKALIKE_DOMAINS --env lookalike < domains.txt
```

### What `scripts/verify-lookalike-live.mjs` proves after every deploy

The three things `verify-lookalike` cannot see because they are decided on the
CDN, not in this repository:

- every file is served byte for byte as built: the pages and `robots.txt`,
  and the fonts, logo and favicons. Nothing rewrites anything on this zone by
  design, so any difference is an edge-side rewrite (Optimizer, `x-bo-version`
  in the response) and fails at once.
- an unknown path (`/secret/verify-lookalike-live-<random>`) answers 404
  with the body of `404.html`: the storage zone's custom 404 path is set.
- every response carries `X-Robots-Tag: noindex`, `frame-ancestors 'none'`
  and `Strict-Transport-Security`, fonts and images included, and the HSTS
  `max-age` is parsed: `max-age=0` switches HSTS off and fails, as does
  anything under six months. `Referrer-Policy` and `Cache-Control` are not
  checked yet, and the root exception above is not known to it yet either.

A deploy whose zone is missing any of these fails loudly rather than shipping a
notice site that is indexable, framable or dead on a phishing path.

### Not yet automated

A reconciliation script that reads `LOOKALIKE_DOMAINS` from
`config/domains.ts` and from the secret, and reports or applies the hostname
set on the pull zone, the way `edge/error-page/cli.mjs` reports drift. It must
not print the secret's hostnames: the log is public, and GitHub masks the
secret's value, not each hostname taken from it, so it masks each one with
`::add-mask::` first. Until then, hostnames are added in the Bunny dashboard
per the checklist below.

## Per-domain checklist

Add the domain to the `LOOKALIKE_DOMAINS` secret when it is acquired. Only a
domain anyone would guess goes in `config/domains.ts` instead, with
`registered` set to the registry creation date from WHOIS or RDAP;
`test/unit/lookalike/domains.test.ts` checks the entry's shape. Then on the
domain's DNS:

- `A`/`CNAME` for the apex and `*` to the pull zone
- `TXT "v=spf1 -all"` at the apex: no host may send mail as this domain
- `TXT "v=DMARC1; p=reject"` at `_dmarc`
- a null MX (`MX 0 .`): the domain receives no mail either
- `CAA` restricting issuance to the CDN's certificate authority
- DNSSEC if the registrar supports it

Without the mail records a domain that sends no mail can still be used to
send phishing email that appears to come from it.

## Wording

The copy says the domain is owned by Onetime Secret, that it is not the
official service, and that visitors cannot create or view secrets here. It
says nothing about a domain's history, how it was acquired, or anyone who held
it before. Keep it that way: the text is generic across every domain, carries
no claim that would need per-domain evidence, and explains nothing about how
these domains are handled. It also avoids self-vouching claims (such as "this
page sends no data") that an imposter's copy could repeat word for word.

There are no outbound links, including on the logo, in the footer, or in the
recovery guidance. Only local language switching remains linked. Visitors are
instructed to type the official address or use a previously verified bookmark,
not to trust a destination suggested by an official-looking notice. The large
address is one unbroken string taken from `CANONICAL_ORIGIN`, with `onetime`
in bold: weight marks the word boundary because a visible gap gets typed as a
space. Recovery guidance is conditional ("if you entered...") and does not
assert that a breach occurred.
