/**
 * Ambient `import.meta.env` for unit tests.
 *
 * Source modules pulled into a test (for example the jurisdiction store, which
 * reads VITE_PUBLIC_API_BASE_URL) rely on Vite's `import.meta.env`. The app gets
 * that from `vite/client`, which this test project deliberately does not pull in
 * (see vitest.d.ts), so declare the minimum here.
 *
 * SCOPE: this file must stay inside test/unit/tsconfig.json's `include` and
 * outside the root tsconfig's. Merging it into the app's program would collide
 * with Vite's own `ImportMeta.env: ImportMetaEnv` ("subsequent property
 * declarations must have the same type"). The root tsconfig currently includes
 * "tests/**\/*" (plural) while this directory is test/ (singular), so it is out
 * of reach — keep it that way rather than relying on that typo.
 */

interface ImportMeta {
  readonly env: Record<string, string | boolean | undefined>;
}
