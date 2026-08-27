// edge/vite.config.ts
//
// Bundles edge scripts into single-file ES modules for pasting into the
// BunnyCDN edge script editor. One script per invocation, selected by mode:
//
//   vite build --config edge/vite.config.ts --mode auth-redirect
//   vite build --config edge/vite.config.ts --mode country-injection
//
// `pnpm edge:build` runs both.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

/** Build mode → entry file name (without extension) */
const ENTRIES: Record<string, string> = {
  "auth-redirect": "bunnycdn-auth-redirect",
  "country-injection": "bunnycdn-country-injection",
};

export default defineConfig(({ mode }) => {
  const name = ENTRIES[mode];

  // A typo'd mode must fail loudly: these bundles are pasted straight into a
  // production dashboard, so silently emitting the wrong script is the worst
  // available outcome.
  if (!name) {
    throw new Error(
      `Unknown edge build mode "${mode}". Use one of: ${Object.keys(ENTRIES).join(", ")}`,
    );
  }

  return {
    // Vite copies `publicDir` into `outDir` on every build. Left on, each
    // `pnpm edge:build` buries the two bundles under a copy of the whole
    // `public/` tree — favicons, sitemap, robots.txt — and the deploy step is
    // "find the right file in the Bunny dashboard paste box". That noise is
    // how the wrong file gets pasted. edge/dist holds exactly two files.
    publicDir: false,
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("../src", import.meta.url)),
      },
    },
    build: {
      lib: {
        entry: fileURLToPath(new URL(`./${name}.ts`, import.meta.url)),
        formats: ["es"],
        fileName: () => `${name}.js`,
      },
      outDir: fileURLToPath(new URL("./dist", import.meta.url)),
      // Each run overwrites its own deterministic file name. Never empty the
      // directory: the two bundles are built by separate invocations.
      emptyOutDir: false,
      minify: false,
      target: "es2022",
      rollupOptions: {
        // Deno resolves `npm:` specifiers natively in a deployed edge script,
        // so the import must survive bundling intact.
        external: [/^npm:/],
      },
    },
  };
});
