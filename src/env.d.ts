/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Vue SFC declarations for TypeScript
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<Record<string, never>, Record<string, never>, any>;
  export default component;
}
