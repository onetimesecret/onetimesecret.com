// config/astro/env.ts

import { AstroUserConfig } from "astro";
import { envField } from "astro/config";

// https://docs.astro.build/en/guides/environment-variables/#in-the-astro-config-file

// register variables as a string, number, enum, or boolean
export function createConfig(): AstroUserConfig["env"] {
  return {
    schema: {
      // Debug mode for development
      // import { VITE_DEBUG } from "astro:env/server";
      VITE_DEBUG: envField.boolean({
        context: "server",
        access: "public",
        default: false,
      }),

      // Public API base URL for homepage secret link UI
      // import { VITE_PUBLIC_API_BASE_URL } from "astro:env/client";
      VITE_PUBLIC_API_BASE_URL: envField.string({
        context: "client",
        access: "public",
        default: "https://dev.onetime.dev",
      }),

      // Sentry configuration
      SENTRY_DSN: envField.string({
        context: "server",
        access: "public",
        default: "",
      }),
      SENTRY_ORG: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      SENTRY_AUTH_TOKEN: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      SENTRY_PROJECT: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),

      // Sentry configuration
      CLIENT_SENTRY_DSN: envField.string({
        context: "client",
        access: "public",
        default: "",
      }),
      CLIENT_SENTRY_ORG: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      CLIENT_SENTRY_AUTH_TOKEN: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      CLIENT_SENTRY_PROJECT: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
    },
  };
}
