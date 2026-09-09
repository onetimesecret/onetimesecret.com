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

CI runs on pull requests to `main` and `develop`, and on pushes to `develop`. Its build job runs
the same frozen install, production build, and bundle verification. A separate required job runs
the browser hydration test described below.

## Validate a production build

A successful build does not prove that browser interaction works. On 2026-09-08, a deployment
shipped client chunks in which Vite's module preload helper had replaced `import.meta` with an
empty object. Every `<astro-island>` failed to hydrate in every browser. Pages rendered normally,
but their interactive controls did not work.

The repository uses static bundle verification, browser tests, and a post-deployment smoke test
to detect this failure mode.

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

## Verify production after deployment

Open [onetimesecret.com](https://onetimesecret.com/) with the browser console visible. Confirm
that:

- the console contains no `[astro-island] Error hydrating` messages;
- entering text in the secret field enables the Create Link button; and
- clicking the region selector opens it.

If any check fails, treat the deployed bundle as broken even if CI passed. Run the production
workflow with `workflow_dispatch` against a branch or tag containing a known-good commit. The
upload overwrites matching assets, and the final purge clears the pull-zone cache.

## Keep deployments reproducible

- Let `pnpm/action-setup` read the pnpm version from `packageManager`. Do not add a `version:`
  override to the action.
- Use `pnpm install --frozen-lockfile` in CI and deployment workflows.
- When changing dependencies, update `pnpm-lock.yaml` with the pnpm version declared in
  `package.json` and include it in the same pull request.
- Run `pnpm build:verify` after every production build whose output will be served to browsers.
