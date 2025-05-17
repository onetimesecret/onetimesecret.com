// config/astro/vite.ts

// https://docs.astro.build/en/guides/environment-variables/#setting-environment-variables
/**
 * "pnpm does not allow you to import modules that are not directly installed in
* your project. If you are using pnpm, you will need to install vite to use
* the loadEnv helper."

*/
import tailwindcss from "@tailwindcss/vite";
import { resolve as pathResolve } from "path";
import type { UserConfig } from "vite";
import viteSSRGlobals from "../../vite-ssr-globals.js";

// Controls debug settings throughout the configuration
// Also used for __VUE_PROD_DEVTOOLS__ to enable Vue devtools in production
const DEBUG = process.env.VITE_DEBUG === "true";

/**
 * Creates a Vite configuration for Astro
 * @param astroPath - The root path of the Astro project
 * @param env - Environment variables loaded with Vite's loadEnv
 */
export function createConfig(
  astroPath: string,
  env: Record<string, string>,
): UserConfig {
  // Remember, for security reasons, only variables prefixed with VITE_ are
  // available here to prevent accidental exposure of sensitive
  // environment variables to the client-side code.
  const viteBaseUrl = env.VITE_BASE_URL;

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
    env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS ??
    env.VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS;

  return {
    build: {
      sourcemap: "inline" as const,
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
      hmr: {
        // Configure HMR to work through your proxy
        clientPort: 4321, // Use standard HTTPS port
        path: "/?token=pMCN-nyXJX4G", // Match the token path pattern
        protocol: "ws", // Use secure WebSocket
        host: "localhost", // Use your proxy domain
      },
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
        env.PUBLIC_API_BASE_URL,
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
