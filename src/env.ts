// src/env.ts
/**
 * Environment setup script for Onetime Secret
 *
 * This module addresses a critical issue with SSR (Server Side Rendering) in Vue applications
 * where global variables defined in Vite's `define` configuration aren't properly injected
 * during the server rendering phase. This specifically resolves the problem with
 * `__VUE_PROD_DEVTOOLS__` being undefined in vue-i18n.
 *
 * PURPOSE:
 * - Ensures consistent environment variables across server and client
 * - Prevents "ReferenceError: __VUE_PROD_DEVTOOLS__ is not defined" in vue-i18n
 * - Provides type-safe access to environment variables
 *
 * USAGE:
 * Import and call setupGlobalVars() early in your application bootstrapping process
 * or import this module directly for automatic execution.
 */

/**
 * Safely define global variables that might be missing in certain contexts
 * particularly during server-side rendering where Vite's define option
 * doesn't take effect.
 *
 * PROBLEM ADDRESSED:
 * During SSR, vue-i18n attempts to access `__VUE_PROD_DEVTOOLS__` in code like:
 * ```
 * if (((process.env.NODE_ENV !== 'production') || __VUE_PROD_DEVTOOLS__) && !false) {
 *   app.__VUE_I18N__ = i18n;
 * }
 * ```
 *
 * This causes a ReferenceError because the variable isn't defined in the server context.
 *
 * @returns {void}
 */
export function setupGlobalVars(): void {
  if (typeof globalThis !== "undefined") {
    // Define Vue production devtools flag if not already defined
    if (typeof __VUE_PROD_DEVTOOLS__ === "undefined") {
      // @ts-ignore - Defining global variable
      globalThis.__VUE_PROD_DEVTOOLS__ = false;
    }

    // Define NODE_ENV if not already defined
    if (
      typeof process === "undefined" ||
      typeof import.meta.env === "undefined" ||
      !import.meta.env.NODE_ENV
    ) {
      // @ts-ignore - Defining global object
      if (typeof process === "undefined") globalThis.process = {};

      // Use a local variable to store the environment value
      const nodeEnv = import.meta.env?.MODE || "production";
      // Set on process.env instead of import.meta.env
      // @ts-ignore
      if (typeof process.env === "undefined") process.env = {};
      process.env.NODE_ENV = nodeEnv;
    }
  }
}

// Run setup immediately when this module is imported
setupGlobalVars();

/**
 * Get environment variable with type safety
 *
 * Wrapper around import.meta.env that provides:
 * - Type safety for environment variables
 * - Default values for missing variables
 * - Consistent access pattern across your application
 *
 * @param {string} key - Environment variable name
 * @param {string} defaultValue - Fallback value if the variable is not defined
 * @returns {string} The environment variable value or the default
 */
export function getEnv(key: string, defaultValue: string = ""): string {
  return import.meta.env?.[key] || defaultValue;
}

/**
 * Environment variables access with type checking
 *
 * Provides a structured, type-safe interface to commonly used
 * environment variables. Use this object instead of directly
 * accessing import.meta.env to ensure consistency and type safety.
 *
 * Example: env.isDevelopment instead of import.meta.env.DEV
 */
export const env = {
  baseUrl: getEnv("VITE_BASE_URL", ""),
  isDevelopment: import.meta.env?.DEV === true,
  isProduction: import.meta.env?.PROD === true,
  mode: import.meta.env?.MODE || "production",
  sentryDsn: getEnv("PUBLIC_SENTRY_DSN", ""),
};

// Export default for convenient importing
export default { setupGlobalVars, env };
