/**
 * Ambient declaration for single-file components imported by unit tests.
 *
 * The app itself gets `*.vue` typing from the Astro/Vite client types, which
 * this test project deliberately does not pull in (see vitest.d.ts: the type
 * surface here must hold up even when node_modules is absent). Component tests
 * mount real SFCs, so they need a minimal stand-in.
 */

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<Record<string, unknown>, object, unknown>;
  export default component;
}
