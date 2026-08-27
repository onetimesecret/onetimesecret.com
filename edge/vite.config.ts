// edge/vite.config.ts
//
// Bundles edge scripts into single-file ES modules for pasting into
// the BunnyCDN edge script editor. Usage: pnpm edge:build
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("../src", import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: fileURLToPath(
        new URL("./bunnycdn-auth-redirect.ts", import.meta.url),
      ),
      formats: ["es"],
      fileName: () => "bunnycdn-auth-redirect.js",
    },
    outDir: fileURLToPath(new URL("./dist", import.meta.url)),
    emptyOutDir: true,
    minify: false,
    target: "es2022",
  },
});
