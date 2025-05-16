// config/astro/redirects.ts

/**
 * Astro's redirect configuration is static and evaluated at build time, not
 * runtime so we can't access browser language preferences here. For dynamic
 * language redirection, we'd need to use one of the following approaches:
 *
 *    * Option 1: Client-side redirect with index.astro
 *    * Option 2: Server middleware (SSR mode only)
 *
 */
export function createConfig() {
  return {
    // "/info/security": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/info/security",
    // },
    // "/info/terms": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/info/terms",
    // },
    // "/info/privacy": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/info/privacy",
    // },
    // "/security": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/info/security",
    // },
    // "/terms": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/info/terms",
    // },
    // "/privacy": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/info/privacy",
    // },
    // "/about": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/about",
    // },
    // "/pricing": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/pricing",
    // },
    // "/signup": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/signup",
    // },
    // "/signin": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/signin",
    // },
  };
}
