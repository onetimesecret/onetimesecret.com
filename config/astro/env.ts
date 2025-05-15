// config/astro/env.mjs

import { envField } from "astro/config";

// https://docs.astro.build/en/guides/environment-variables/#in-the-astro-config-file

// register variables as a string, number, enum, or boolean
export function createConfig() {
  schema: {
    API_URL: envField.string({
      context: "client",
      access: "public",
      optional: true,
    }),
    PUBLIC_SENTRY_DSN: envField.string({
      context: "server",
      access: "public",
      default: 4321,
    }),
    API_SECRET: envField.string({ context: "server", access: "secret" }),
  },
});
