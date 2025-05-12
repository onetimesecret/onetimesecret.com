// vite.d.ts
//
// Since we're creating a declaration file for Vite, which is a build tool
// and not a runtime dependency, it's most common to place it in a way that
// TypeScript will automatically pick it up without additional configuration
// in tsconfig.json.
//
declare const __VUE_PROD_DEVTOOLS__: boolean;

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_BASE_URL: string;
  readonly VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS?: string;
  readonly PUBLIC_API_URL: string;
  readonly PUBLIC_SENTRY_DSN?: string;
  readonly SENTRY_ORG?: string;
  readonly SENTRY_PROJECT?: string;
  readonly SENTRY_AUTH_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
