// vite-ssr-globals.ts
import type { Plugin } from 'vite';

/**
 * Vite plugin to ensure global variables are defined in SSR context
 *
 * PROBLEM:
 * During server-side rendering (SSR), Vite's `define` configuration doesn't
 * inject global variables like it does for client-side code. This causes errors
 * when libraries try to access these globals.
 *
 * ISSUES SOLVED:
 *
 * 1. __VUE_PROD_DEVTOOLS__ is not defined
 *    - vue-i18n expects this variable during installation
 *    - Error: ReferenceError: __VUE_PROD_DEVTOOLS__ is not defined
 *
 * 2. localStorage is not defined
 *    - @vue/devtools-kit tries to access localStorage during SSR
 *    - Error: localStorage.getItem is not a function
 *
 * SOLUTION:
 * This plugin ensures that required global variables are defined in both:
 * 1. Server context - via the configureServer hook
 *    - Defines __VUE_PROD_DEVTOOLS__ as false
 *    - Mocks localStorage with a no-op implementation
 * 2. Each module - by injecting the variable definition at the start of files
 *
 * Example code that requires this:
 * ```javascript
 * // vue-i18n
 * if (((import.meta.env.NODE_ENV !== 'production') || __VUE_PROD_DEVTOOLS__) && !false) {
 *   app.__VUE_I18N__ = i18n;
 * }
 *
 * // @vue/devtools-kit
 * const state = localStorage.getItem('devtools-timeline-state');
 * ```
 */
export default function viteSSRGlobals(): Plugin {
  return {
    name: "vite-ssr-globals",
    /**
     * Defines globals in the Vite dev server context
     * This ensures they're available when the server is rendering Vue components
     */
    configureServer() {
      // Define globals in SSR context
      if (typeof global !== "undefined") {
        // This defines the variable in Node.js context where SSR happens
        (global as typeof globalThis & { __VUE_PROD_DEVTOOLS__?: boolean }).__VUE_PROD_DEVTOOLS__ = false;

        // Mock localStorage for Vue devtools during SSR
        // This prevents errors when @vue/devtools-kit tries to access localStorage
        if (typeof global.localStorage === 'undefined') {
          const mockStorage: Storage = {
            length: 0,
            clear: () => {},
            getItem: () => null,
            key: () => null,
            removeItem: () => {},
            setItem: () => {},
          };

          Object.defineProperty(global, 'localStorage', {
            value: mockStorage,
            writable: true,
            configurable: true,
          });
        }
      }
    },
    /**
     * Transforms source files to include global variable definitions
     * This ensures variables are defined in both client and SSR contexts
     */
    transform(code: string, id: string) {
      // Early return if not for SSR or not a Vue/JS/TS file
      // We don't transform node_modules to avoid unexpected behavior
      if (
        !id.includes("node_modules") &&
        (id.endsWith(".vue") ||
          id.endsWith(".js") ||
          id.endsWith(".ts") ||
          id.endsWith(".mjs"))
      ) {
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
          map: null, // We don't need source maps for this simple prepend
        };
      }
      return null;
    },
  };
}
