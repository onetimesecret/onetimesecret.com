// config/astro/vite.ts

import tailwindcss from "@tailwindcss/vite";
import viteSSRGlobals from "../../vite-ssr-globals.js";

// Node.js built-ins
import { dirname, resolve as pathResolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Controls debug settings throughout the configuration
// Also used for __VUE_PROD_DEVTOOLS__ to enable Vue devtools in production
const DEBUG = process.env.VITE_DEBUG === "true";

// Remember, for security reasons, only variables prefixed with VITE_ are
// available here to prevent accidental exposure of sensitive
// environment variables to the client-side code.
const viteBaseUrl = process.env.VITE_BASE_URL;

/**
 * Configure additional server allowed hosts
 *
 * According to the documentation, we should be able to set the allowed hosts
 * via __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS but as of 5.4.15, that is not
 * working as expected. So here we capture the value of that env var with
 * and without the __ prefix and if either are defined, add the hosts to
 * server.allowedHosts below. Multiple hosts can be separated by commas.
 *
 * @see https://vite.dev/config/server-options.html#server-allowedhosts
 * @see https://github.com/vitejs/vite/security/advisories/GHSA-vg6x-rcgg-rjx6
 */
const viteAdditionalServerAllowedHosts =
  process.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS ??
  process.env.VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS;

export function createConfig(astroPath: string): Record<string, any> {
  return {
    build: {
      sourcemap: "inline",
    },
    plugins: [tailwindcss(), viteSSRGlobals()],
    resolve: {
      alias: {
        "@": pathResolve(astroPath, "src"),
        "@root": pathResolve(astroPath),
        "@config": pathResolve(astroPath, "config"),
      },
    },
    server: {
      /**
       * Configure server's allowed hosts using IIFE
       *
       * We use an IIFE (Immediately Invoked Function Expression) that executes
       * exactly once during config load/parsing time. The returned array becomes
       * the value of allowedHosts. This approach helps avoid adding empty strings
       * to the array and provides a cleaner configuration.
       */
      allowedHosts: (() => {
        // Start with default allowed hosts
        const hosts = ["localhost", "127.0.0.1"];

        // Add additional hosts from environment variables if defined
        if (viteAdditionalServerAllowedHosts) {
          // Split by comma and add each host to the array
          const additionalHosts = viteAdditionalServerAllowedHosts
            .split(",")
            .map((host: string) => host.trim());
          hosts.push(...additionalHosts.filter((host: string) => host !== ""));
        }

        // Log all the allowed hosts for debugging
        if (DEBUG) {
          const timestamp = new Date().toLocaleTimeString();
          console.log(`${timestamp} [vite] Vite server allowed hosts:`, hosts);
        }

        return hosts;
      })(),
    },
    define: {
      "process.env.VITE_BASE_URL": JSON.stringify(viteBaseUrl),
      "process.env.VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS": JSON.stringify(
        viteAdditionalServerAllowedHosts,
      ),
      // Define PUBLIC_API_BASE_URL explicitly to ensure it's available in client code
      "process.env.PUBLIC_API_BASE_URL": JSON.stringify(
        process.env.PUBLIC_API_BASE_URL,
      ),

      /**
       * CRITICAL: This global variable must be defined as a boolean (not string)
       * Vue i18n expects this variable during installation and will throw:
       * "ReferenceError: __VUE_PROD_DEVTOOLS__ is not defined"
       * if not properly set. The viteSSRGlobals plugin ensures it's also
       * defined in SSR contexts where this define setting doesn't apply.
       */
      __VUE_PROD_DEVTOOLS__: false,
    },
  };
}
