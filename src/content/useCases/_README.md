# useCases content collection

This directory backs the `useCases` content collection defined in
`src/content.config.ts` (Content Layer `glob` loader).

It is intentionally empty for now: the use cases rendered on the site are
currently defined in TypeScript under `src/data/product/usecases/`. This
placeholder keeps the collection's base directory present so the glob loader
does not emit a "base directory does not exist" warning on clean checkouts.

Files prefixed with `_` (like this one) are excluded from the collection by
the loader's glob pattern, so this README is not parsed as content. To add
real use-case pages, drop `*.md`/`*.mdx` files here using `[lang]/[slug]`
paths (e.g. `en/secure-handoff.md`).
