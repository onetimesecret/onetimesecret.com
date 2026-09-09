# Deployment

This guide is for maintainers who deploy or validate the website. It covers the static Astro
site deployed by GitHub Actions. It does not cover building or deploying the Bunny edge scripts
under `edge/`.

Astro writes the production site to `dist/`. The deployment workflow uploads that directory to
BunnyCDN storage, waits for storage replication, and then purges the pull-zone cache.

## Prerequisites

For local validation, use:

- Node.js 26 or later, as required by `package.json`
- the pnpm version in the `packageManager` field of `package.json`
- installed Playwright Chromium browsers when running the hydration test

Run all local commands from the repository root.

A manual deployment requires access to run GitHub Actions workflows for this repository.

## Branches and environments

| Branch    | Workflow                                  | GitHub environment |
| --------- | ----------------------------------------- | ------------------ |
| `develop` | `.github/workflows/deploy-staging.yml`    | `staging`          |
| `main`    | `.github/workflows/deploy-production.yml` | `production`       |

Both workflows run on a push to their branch and can also be started with `workflow_dispatch`.
A production release merges `develop` into `main`; the push to `main` starts the production
deployment.

The deployment workflows do not depend on the CI workflow. Before starting a manual deployment,
confirm that the commit has passed CI.

## What a deployment does

Each deployment workflow:

1. Installs Node.js 26 and the pnpm version from `package.json`.
2. Compares `pnpm --version` with the `packageManager` version and stops on a mismatch.
3. Runs `pnpm install --frozen-lockfile`. If `pnpm-lock.yaml` does not match `package.json`,
   installation fails instead of resolving a new dependency tree.
4. Runs `pnpm build` to create `dist/`.
5. Runs `pnpm build:verify`. Nothing is uploaded if verification fails.
6. Uploads `dist/` to BunnyCDN storage without deleting remote files that are absent locally.
7. Waits 10 seconds for storage replication.
8. Purges the BunnyCDN pull-zone cache.
9. Runs `pnpm build:verify:live` against the site URL. The deployment fails if the JavaScript
   the CDN serves differs from `dist/`.

CI runs on pull requests to `main` and `develop`, and on pushes to `develop`. Its build job runs
the same frozen install, production build, and bundle verification. A separate required job runs
the browser hydration test described below.

## Validate a production build

A successful build does not prove that browser interaction works, and a correct `dist/` does not
prove that browsers receive it. On 2026-09-08 and again on 2026-09-09, every JavaScript chunk
served from `onetimesecret.com/assets/` differed from the file the deployment uploaded. Bunny
Optimizer, enabled on the production pull zone, re-minified each chunk at the edge with a
JavaScript target that has no `import.meta`, and replaced it with an empty object. Vite's module
preload helper then threw on its first dependency and every `<astro-island>` failed to hydrate in
every browser. Pages rendered normally, but their interactive controls did not work. The uploaded
`dist/` passed `pnpm build:verify` both times.

The 2026-09-09 deployment was built from `a08cef1`. A local build of that commit reproduces the
uploaded files exactly, hash for hash. The served copies carry `x-bo-*` response headers, a
`last-modified` two minutes after the upload finished, and an `x-downloadsize` equal to the size
of the local file. Source maps, which Optimizer does not process, keep the upload timestamp.

The rewrite only became fatal with Vite 8 (PR #193). Vite 7 resolved preload dependencies with
`"/" + dep`, so the shipped code contained no `import.meta` and the lowering was harmless. Vite 8
resolves them with `import.meta.resolve` and `import.meta.url` unconditionally.

Bunny Optimizer's JavaScript minification must stay disabled on every pull zone that serves this
site. The bundle is already minified by esbuild; Optimizer reports a 0.00% compression ratio on it
and only adds risk. This is a Bunny dashboard setting, not something the repository controls,
which is why the deployment also verifies the served bytes.

The repository uses static bundle verification, browser tests, and a post-deployment comparison
of served and built files to detect this failure mode.

### Verify the generated bundle

Run:

```bash
pnpm build
pnpm build:verify
```

`scripts/verify-dist.mjs` scans JavaScript chunks and HTML files under `dist/`. It fails if:

- a chunk containing Vite's preload helper does not resolve dependency URLs with
  `new URL(dep, import.meta.url)`;
- a JavaScript chunk or inline HTML script contains the `import_meta` stub that esbuild emits
  when lowering `import.meta`; or
- no chunk contains the preload helper marker, because the script cannot verify the helper.

A successful check prints a `[verify-dist] OK` summary. CI and both deployment workflows run this
command directly after `pnpm build`.

### Test island hydration in a browser

Run:

```bash
pnpm test:e2e island-hydration --project=chromium --project="Mobile Chrome"
```

The Playwright configuration starts `pnpm preview`; run `pnpm build` first so that `dist/` exists.
The test loads `/` and `/en/pricing` and verifies that:

- every `client:load` and `client:only` island removes its `ssr` attribute;
- no `Error hydrating` message reaches the browser console;
- entering text in the secret field enables the Create Link button; and
- clicking the region selector opens its listbox.

The `e2e-hydration` job in `.github/workflows/ci.yml` runs this test with desktop and mobile
Chromium. The job must pass for `ci-success` to pass.

### Verify the served bundle

Run, after a deployment has finished:

```bash
pnpm build:verify:live https://onetimesecret.com
```

`scripts/verify-live.mjs` fetches every `dist/assets/*.js` chunk from the given origin and
requires each response body to equal the local file byte for byte. It retries a few times to allow
for cache purge and storage replication, then fails naming every differing file with its
`last-modified`, `x-bo-version` and `x-downloadsize` headers. When the served preload helper no
longer resolves with `import.meta.url`, it says so explicitly. Both deployment workflows run this
as their final step.

Run `pnpm build` at the deployed commit first, with the same `VITE_BASE_URL`, `SENTRY_ORG`,
`SENTRY_PROJECT` and `SENTRY_AUTH_TOKEN`, so that `dist/` matches what was uploaded. The Sentry
release and debug-id snippets are part of the chunk content.

## Verify production after deployment

Open [onetimesecret.com](https://onetimesecret.com/) with the browser console visible. Confirm
that:

- the console contains no `[astro-island] Error hydrating` messages;
- entering text in the secret field enables the Create Link button; and
- clicking the region selector opens it.

If any check fails, treat the deployed bundle as broken even if CI passed. Fetch one chunk with
`curl -sI` and look for `x-bo-version` in the response. If it is present, Bunny Optimizer is
rewriting JavaScript and must be turned off on the pull zone; redeploying will not help. Otherwise
run the production workflow with `workflow_dispatch` against a branch or tag containing a
known-good commit. The upload overwrites matching assets, and the final purge clears the pull-zone
cache.

## Keep deployments reproducible

- Let `pnpm/action-setup` read the pnpm version from `packageManager`. Do not add a `version:`
  override to the action.
- Use `pnpm install --frozen-lockfile` in CI and deployment workflows.
- When changing dependencies, update `pnpm-lock.yaml` with the pnpm version declared in
  `package.json` and include it in the same pull request.
- Run `pnpm build:verify` after every production build whose output will be served to browsers.
- Keep Bunny Optimizer's JavaScript minification disabled on every pull zone for this site, and
  run `pnpm build:verify:live` after any change to pull-zone settings.
