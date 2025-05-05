// vite-ssr-globals.js
/**
 * Vite plugin to ensure global variables are defined in SSR context
 *
 * PROBLEM:
 * During server-side rendering (SSR), Vite's `define` configuration doesn't
 * inject global variables like it does for client-side code. This causes errors
 * when libraries try to access these globals, especially `__VUE_PROD_DEVTOOLS__`
 * which vue-i18n expects to be defined.
 *
 * SOLUTION:
 * This plugin ensures that required global variables are defined in both:
 * 1. Server context - via the configureServer hook
 * 2. Each module - by injecting the variable definition at the start of files
 *
 * The specific error this solves:
 * ```
 * ReferenceError: __VUE_PROD_DEVTOOLS__ is not defined
 *   at Object.install (vue-i18n.mjs:2061:61)
 * ```
 *
 * This happens because vue-i18n contains code like:
 * ```
 * if (((process.env.NODE_ENV !== 'production') || __VUE_PROD_DEVTOOLS__) && !false) {
 *   app.__VUE_I18N__ = i18n;
 * }
 * ```
 */
export default function viteSSRGlobals() {
  return {
    name: 'vite-ssr-globals',
    /**
     * Defines globals in the Vite dev server context
     * This ensures they're available when the server is rendering Vue components
     * @param {import('vite').ViteDevServer} server - Vite dev server instance
     */
    configureServer(server) {
      // Define globals in SSR context
      if (typeof global !== 'undefined') {
        // This defines the variable in Node.js context where SSR happens
        global.__VUE_PROD_DEVTOOLS__ = false;
      }
    },
    /**
     * Transforms source files to include global variable definitions
     * This ensures variables are defined in both client and SSR contexts
     *
     * @param {string} code - Source code content
     * @param {string} id - File path
     * @returns {Object|null} - Transformed code or null if no transformation
     */
    transform(code, id) {
      // Early return if not for SSR or not a Vue/JS/TS file
      // We don't transform node_modules to avoid unexpected behavior
      if (!id.includes('node_modules') &&
          (id.endsWith('.vue') || id.endsWith('.js') || id.endsWith('.ts') || id.endsWith('.mjs'))) {

        // Add a check at the beginning of each module to ensure the global is defined
        // Uses globalThis which works in both browser and Node.js environments
        const ssrCheck = `
// [Auto-injected by vite-ssr-globals plugin]
// Ensures __VUE_PROD_DEVTOOLS__ is defined to prevent errors in vue-i18n
if (typeof globalThis !== 'undefined' && typeof __VUE_PROD_DEVTOOLS__ === 'undefined') {
  globalThis.__VUE_PROD_DEVTOOLS__ = false;
}
`;
        return {
          code: ssrCheck + code,
          map: null // We don't need source maps for this simple prepend
        };
      }
      return null;
    }
  };
}
