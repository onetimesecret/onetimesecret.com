# Incident: Homepage hero form unresponsive (Create Link + region selector)

- **Status:** Investigating — root cause identified, fix pending
- **Reported:** 2026-09-08
- **Author:** Delano
- **Severity:** SEV-2 (primary conversion surface degraded; no data loss)
- **Affected surface:** Homepage hero (`/` and `/[lang]/`), the `Homepage` Vue island
- **Suspected environment:** Mobile browsers (needs confirmation of exact browser/OS)
- **Reference build:** `306cb0e` (branch `develop`)

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

## Leading hypothesis

The hero island fails to hydrate on the affected (mobile) browsers. Given the
timing, the most probable trigger is PR #193. Candidate mechanisms, in rough
order of likelihood:

1. **A runtime error thrown during client setup on the affected browser**,
   aborting hydration of the island. Would not surface in desktop/emulated
   Chromium.
2. **The renderer or component chunk fails to load in production** (404, wrong
   MIME type, or a stale/mismatched cached bundle) after the Astro 7 / Vite 8
   asset-hashing change.
3. **An unsupported JS feature** emitted into the new client bundle by the
   upgraded Vite 8 / Astro 7 toolchain (or the Node 26 build target) that the
   affected browser cannot parse or execute.

## Next steps

1. **Get the real signal from a failing device.** On an affected mobile
   browser, capture: any console error / CSP violation, whether the Network
   tab shows the island's `Homepage.*.js` and `client.*.js` chunks loading
   (status + MIME type), and whether typing reveals the footer button. This
   single data point discriminates between the three hypotheses above.
2. **Confirm scope** — which browsers/OS versions, and whether desktop is
   truly clean.
3. **Bisect PR #193** if the device signal implicates the bundle: build the
   homepage at the pre-upgrade dependency set and compare hydration on the
   affected browser.
4. Add an e2e assertion that the hero island actually hydrates (region
   dropdown opens; footer Create Link button becomes enabled after input) so a
   future hydration regression fails CI instead of shipping.

## Timeline (UTC)

- **2026-09-07 23:15** — PR #193 (`chore/deps-update-all`) merged: Astro 7,
  Vite 8, `@astrojs/vue` 7, Node 26.
- **2026-09-08** — Create Link button reported unresponsive on the homepage.
- **2026-09-08** — Region selector dropdown also reported unresponsive;
  suspected mobile-specific. Root-cause mechanism (island not hydrating)
  identified; fix pending device-level diagnostics.
