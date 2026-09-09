# Incident: Homepage hero form unresponsive (Create Link + region selector)

- **Status:** Root cause confirmed at the bundle level; fix and guards in
  review, production redeploy pending
- **Reported:** 2026-09-08
- **Author:** Delano
- **Severity:** SEV-1 (every interactive control on the site is inert; no data
  loss)
- **Affected surface:** Every Vue island on every page: homepage secret form,
  region selector, pricing controls, language switcher, footer islands
- **Environment:** All browsers, desktop and mobile. Reproduced in headless
  Chromium (desktop and iPhone 13 emulation) against a mirror of the deployed
  assets. The "mobile only" framing came from testing a local build on
  desktop, not the deployed one.
- **Reference build:** production deploy run #47 (`ee376a3` on `main`,
  2026-09-08 21:47 UTC), source identical to `306cb0e` on `develop`

## Summary

On the homepage, the **Create Link** button and the **region selector
dropdown** do not respond to interaction. Both controls live inside the same
`client:load` Vue island (`Homepage.vue` → `HeroSection` →
`SecretRegionExperience` → `HomepageSecretForm`/`RegionSelector`). The symptom
is consistent with that island **failing to hydrate** on the affected
browsers: without hydration every interactive control in the island is inert.

No homepage component was changed for this regression. The most recent shared
change large enough to affect island hydration is the dependency upgrade in
**PR #193** (`chore/deps-update-all`, merged 2026-09-07), which moved the
project to Astro 7, Vite 8, `@astrojs/vue` 7, and Node 26.

## Impact

- Visitors cannot create a secret from the homepage form — the site's primary
  call to action.
- Visitors cannot change the storage region from the hero.
- Scope appears limited to mobile; desktop is so far unaffected. Blast radius
  and exact browser coverage are still being confirmed.

## Symptoms and how they map to the cause

When the hero island does not hydrate, the page shows only its
server-rendered fallback. Reproduced by loading the built homepage with
JavaScript disabled (a stand-in for a hydration failure):

- The form renders a **single** "Create Link" button with `disabled = true`.
  This is the SSR "minimal" button shown when no text has been entered
  (`v-if="!showOptions"`, `:disabled="true"` in `SecretForm.vue`). The working
  button lives in a footer that only appears once `showOptions` becomes true,
  which requires reactivity — i.e. hydration. Un-hydrated, the user only ever
  sees the disabled button, so "the Create Link button doesn't work."
- The region pill renders but has no click handler wired, so the dropdown
  never opens.
- The `<textarea>` is a native element, so typing still works — which masks
  the real problem (the footer with the enabled button never appears).

Both reported symptoms are therefore a single fault: **the hero island is not
hydrating**, not two separate control bugs.

## What was verified to work (rules out the obvious)

Tested against a production build (`pnpm build && pnpm preview`) with the
post-upgrade dependencies installed (`astro@7.3.1`, `@astrojs/vue@7.0.2`,
`vite@8.2.2`, `vue@3.5.42`):

- Desktop Chromium and **emulated** mobile (Pixel 5) Chromium: the island
  hydrates, the Create Link button enables on input and dispatches
  `POST https://eu.onetimesecret.com/api/v2/secret/conceal`, and the region
  dropdown opens on click.
- 638/638 unit tests pass.
- The built `<astro-island>` for `Homepage` carries a correct
  `client="load"` with valid `component-url` and `renderer-url`.
- **CSP is not the cause.** `connect-src` (from `generateCspConnectSrc`) and
  the store's `apiBaseUrl` both derive from `VITE_PUBLIC_API_BASE_URL`,
  falling back to `https://<region>.onetimesecret.com`. Every reachable region
  domain (EU/CA/NZ/UK/US) is allowlisted, so the fetch target and the CSP
  cannot diverge. Geo never resolves to a `comingSoon` region.

The failure does **not** reproduce in this environment, which is why it points
to a browser- or build-specific hydration failure rather than a logic bug in
the homepage components.

## Root cause (confirmed 2026-09-09)

The deployed JavaScript is not what the source builds.

Every client chunk served from `onetimesecret.com/assets/` on 2026-09-08 had
been transpiled to roughly an ES2018 target: optional chaining and `??` are
lowered to `== null ? void 0 :` and `var _a` temporaries, optional catch
bindings are gone, and, decisively, `import.meta` was replaced with an empty
object:

```js
// deployed assets/preload-helper.CQUqqgG6.js (excerpt)
const import_meta={};
...
v=function(e){return import_meta.resolve?import_meta.resolve(e):new URL(e,import_meta.url).href}
```

That is Vite's module preload helper. `import_meta.url` is `undefined`, so
`new URL("/assets/App.xxx.js", undefined)` throws `TypeError: Invalid URL` on
the first dependency of every island. The renderer (`client.*.js`) awaits the
preload before mounting, so the rejection aborts hydration. The browser
console shows one line per island:

```
[astro-island] Error hydrating /assets/Homepage.B_sLzx2R.js TypeError: Failed to construct 'URL': Invalid URL
    at v (/assets/preload-helper.CQUqqgG6.js:1:904)
```

Un-hydrated, the page is exactly the SSR fallback described above: a disabled
Create Link button, an inert region pill, a language switcher that does
nothing, pricing toggles that do nothing. No component code is at fault.

### What was compared

| Build | pnpm | Lockfile | Output |
| --- | --- | --- | --- |
| Production deploy run #47 (`main`, 21:47 UTC) | 8.15.9 | **ignored** ("Ignoring not compatible lockfile"), fresh resolve | **lowered, islands broken** |
| Staging deploy run #133 (`develop`, 20:48 UTC) | 8.15.9 | ignored, fresh resolve, identical tree | correct (`preload-helper.Cpf3bp8D.js`) |
| CI build artifact for `306cb0e` | 10.11, `--frozen-lockfile` | honoured | correct (same `Cpf3bp8D` hash) |
| Local, pnpm 11.24 + Node 22/26, with and without a Sentry auth token and `VITE_BASE_URL` | 11.24.0 | honoured | correct |
| Local, pnpm 8.15.9 fresh resolve, Node 22 and Node 26, CI env vars | 8.15.9 | ignored | correct |

The lowering fingerprint (unminified `import_meta` and `_a` names inside an
otherwise minified chunk, `catch(e2)` renames, `const import_meta = {}`) is
what esbuild emits when asked to transpile already-minified code to a target
without `import.meta`. Nothing in the repository, in Astro 7.3.x, Vite 8.2.2,
rolldown 1.2.7 or the Sentry plugin sets such a target, and no dependency in
the tree published a new version between the good staging build and the bad
production build. The exact trigger inside run #47 could not be reproduced.

What is certain is that the deploy jobs were **not building the tree CI
tested**. `pnpm/action-setup` was pinned to pnpm 8 while `package.json`
declares `pnpm@11.24.0`; pnpm 8 cannot read a v9 lockfile, so every deploy
silently re-resolved ~1,090 packages against the live registry (production
got `astro@7.3.2`, released six hours earlier, while the lockfile says
`7.3.1`) and reused a pnpm store restored from a cache keyed on a lockfile it
never read. That made every deploy a unique, unreviewed dependency tree, and
it is the only place in the pipeline where the good and bad builds differ.

## Fix

1. **Deploy workflows build what CI tests.** `deploy-production.yml` and
   `deploy-staging.yml` now take the pnpm version from `packageManager`, run
   `pnpm install --frozen-lockfile`, and cache the store through
   `actions/setup-node` like `ci.yml` does. A deploy whose lockfile does not
   match now fails instead of re-resolving.
2. **The build refuses to ship a bundle that cannot hydrate.**
   `scripts/verify-dist.mjs` (`pnpm build:verify`) scans `dist/assets/*.js`
   for the emptied `import.meta` stub and asserts Vite's preload helper still
   references `import.meta.url`. It runs after `pnpm build` in CI and in both
   deploy workflows, before anything is uploaded. It fails on the deployed
   2026-09-08 bundle and passes on every correct build above.
3. **E2E asserts hydration.** `test/e2e/specs/island-hydration.spec.ts`
   checks that no `astro-island[ssr]` survives page load on `/` and
   `/pricing`, that no `Error hydrating` reaches the console, that Create
   Link enables after typing, and that the region selector opens. It fails
   against the deployed bundle and passes against a correct build.

## Remediation

- Merge the fix to `develop`, promote to `main`, and let the production
  deploy run (or `workflow_dispatch` it). The rebuilt bundle replaces the
  broken chunks; `index.html` references new hashes so no CDN purge beyond the
  workflow's own is needed.
- Confirm on the live site: the console shows no `[astro-island] Error
  hydrating`, and typing in the hero textarea enables Create Link.

## Timeline (UTC)

- **2026-09-07 23:15** — PR #193 (`chore/deps-update-all`) merged: Astro 7,
  Vite 8, `@astrojs/vue` 7, Node 26.
- **2026-09-08** — Create Link button reported unresponsive on the homepage.
- **2026-09-08 20:48** — Staging deploy run #133 (`develop` @ `306cb0e`)
  builds correctly.
- **2026-09-08 21:47** — Production deploy run #47 (`main` @ `ee376a3`, same
  source) ships transpiled-down chunks with an emptied `import.meta`. Every
  island on the site stops hydrating.
- **2026-09-08** — Create Link button reported unresponsive on the homepage;
  region selector also reported unresponsive; suspected mobile-specific.
- **2026-09-09** — Deployed assets mirrored and driven in headless Chromium:
  all six homepage islands fail to hydrate on desktop and mobile with
  `TypeError: Invalid URL` from the preload helper. Deploy workflow found to
  ignore the lockfile. Fix, bundle guard and hydration e2e opened for review.
