// config/astro/redirects.ts

import { AstroUserConfig } from "astro";

/**
 * Astro's redirect configuration is static and evaluated at build time, not
 * runtime so we can't access browser language preferences here. For dynamic
 * language redirection, we'd need to use one of the following approaches:
 *
 *    * Option 1: Client-side redirect with index.astro
 *    * Option 2: Server middleware (SSR mode only)
 *
 */
export function createConfig(): AstroUserConfig["redirects"] {
  return {
    "/info/security": {
      status: 301,
      destination: "https://onetimesecret.com/en/security",
    },
    "/info/terms": {
      status: 301,
      destination: "https://onetimesecret.com/terms",
    },
    "/info/privacy": {
      status: 301,
      destination: "https://onetimesecret.com/privacy",
    },
    "/feedback": {
      status: 301,
      destination: "https://eu.onetimesecret.com/feedback",
    },
    "/security": {
      status: 301,
      destination: "/en/security",
    },
    "/terms": {
      status: 301,
      destination: "/en/terms",
    },
    "/privacy": {
      status: 301,
      destination: "/en/privacy",
    },
    "/about": {
      status: 301,
      destination: "/en/about",
    },
    "/pricing": {
      status: 301,
      destination: "/en/pricing",
    },
    "/signup": {
      status: 302,
      destination: "https://eu.onetimesecret.com/signup",
    },
    "/signin": {
      status: 302,
      destination: "https://eu.onetimesecret.com/signin",
    },
  };
}
