# Deployment

The site is a static Astro build uploaded to BunnyCDN storage, followed by a
pull-zone cache purge. Nothing runs at request time except the Bunny edge
scripts under `edge/`.

## Branches and environments

| Branch    | Workflow                                    | Environment |
| --------- | ------------------------------------------- | ----------- |
| `develop` | `.github/workflows/deploy-staging.yml`      | staging     |
| `main`    | `.github/workflows/deploy-production.yml`   | production  |

Both workflows also accept `workflow_dispatch`. A release is a merge of
`develop` into `main`; the production deploy starts on push.

## What a deploy does

1. Installs pnpm at the version in `package.json` `packageManager` and fails
   if the runner's `pnpm --version` disagrees.
2. `pnpm install --frozen-lockfile`. A lockfile that does not match
   `package.json` fails the deploy instead of being re-resolved.
3. `pnpm build`.
4. `pnpm build:verify` (see below). Nothing is uploaded if this fails.
5. Uploads `dist/` to the storage zone, waits for replication, purges the
   pull zone.

CI (`ci.yml`) runs the same install, build and verify steps on every pull
request and on pushes to `develop`, plus the browser check below, so a build
that reaches a deploy workflow has already passed them once.

## Validating production builds

A green build is not proof the site works. On 2026-09-08 a deploy shipped
client chunks in which Vite's module preload helper had `import.meta`
replaced with an empty object. Every `<astro-island>` failed to hydrate, on
every browser, and the page looked normal with nothing interactive. Three
checks now stand between a build and the CDN.

### `pnpm build:verify`

`scripts/verify-dist.mjs` walks `dist/` and fails if:

- the chunk containing Vite's preload helper no longer resolves dependency
  URLs with `new URL(dep, import.meta.url)`, or
- any JavaScript chunk or inline HTML script contains the `import_meta` stub
  esbuild emits when it lowers `import.meta`, or
- no chunk contains the preload helper marker at all (the check would be
  vacuous, so it fails instead).

Runs in CI and in both deploy workflows directly after `pnpm build`.

### Island hydration e2e

`test/e2e/specs/island-hydration.spec.ts` loads `/` and `/en/pricing` in a
real browser and asserts that every `client:load` and `client:only` island
drops its `ssr` attribute, that no `Error hydrating` reaches the console,
that Create Link enables once the textarea has text, and that the region
selector opens. The `e2e-hydration` job in `ci.yml` runs it on desktop and
mobile Chromium against the production build and is required for
`ci-success`.

Locally:

```bash
pnpm build && pnpm build:verify
pnpm test:e2e island-hydration --project=chromium --project="Mobile Chrome"
```

The Playwright config starts `pnpm preview` itself.

### After a production deploy

Open https://onetimesecret.com/ with the browser console visible.

- No `[astro-island] Error hydrating` lines.
- Typing in the secret textarea enables the Create Link button.
- The region selector opens on click.

If any of these fail, the deployed bundle is broken regardless of what CI
said. Re-run the production deploy from a known-good commit via
`workflow_dispatch`; the upload overwrites the assets and the purge step
clears the edge cache.

## Rules that keep the pipeline reproducible

- Every workflow takes pnpm from `packageManager`. Do not pin a `version:`
  in `pnpm/action-setup`.
- Every install is `--frozen-lockfile`. Update `pnpm-lock.yaml` in the pull
  request that changes dependencies, with the same pnpm.
- `pnpm build:verify` runs after every build that produces something a
  browser will load.
