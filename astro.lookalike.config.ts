// astro.lookalike.config.ts
//
// Second Astro build of this repository: the notice site served on the
// lookalike domains Onetime Secret owns (misspellings and alternate TLDs of
// onetimesecret.com). One build, one output, every lookalike domain is a
// hostname on the same CDN zone; the page reads `location.hostname` in the
// browser, so adding a domain never needs a rebuild. See lookalike/README.md.
//
// Astro cannot exclude pages from `src/pages`, so this config points `srcDir`
// at `lookalike/`, which holds only the notice pages. The `@/` and `@config/`
// aliases still resolve to the main source, so the pages share the styles,
// fonts, locale files and i18n helpers with the real site and cannot drift
// from the brand.
//
// What is deliberately missing compared to astro.config.ts:
//   - no sitemap: these pages are noindex and must not be advertised
//   - no Sentry, no Vue: the site is static text with no islands
//   - no `site`: nothing here emits a canonical, hreflang or absolute URL
//   - no shared `public/`: the real site's robots.txt, sitemap.xsl, llms.txt
//     and webmanifest must not ship. lookalike/public/ holds the notice
//     site's own, and the integration below copies an allowlist of brand
//     assets (fonts, logo, favicons) out of public/ at build time.
//
// Usage: pnpm build:lookalike && pnpm build:verify:lookalike

import { defineConfig } from "astro/config";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "vite";
import { createConfig as createI18nConfig } from "./config/astro/i18n";
import { createConfig as createViteConfig } from "./config/astro/vite";
import { sharedBrandAssets } from "./lookalike/integration";
import { resolveEnvMode } from "./config/site";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// The shared vite config reads VITE_* for defines the main site needs. None
// of them are used by the notice pages, but the aliases and the Tailwind
// plugin come from the same function, and that is what is wanted here.
const env = loadEnv(resolveEnvMode(), process.cwd(), "");
const vite = createViteConfig(__dirname, env);

// https://astro.build/config
export default defineConfig({
  srcDir: "./lookalike",
  publicDir: "./lookalike/public",
  outDir: "./dist-lookalike",

  build: {
    assets: "assets",
    inlineStylesheets: "always",
  },

  compressHTML: true,
  output: "static",

  i18n: createI18nConfig(),

  integrations: [sharedBrandAssets()],

  vite: {
    ...vite,
    build: {
      ...vite?.build,
      // The one processed <script> (the domain comparison) must end up inline:
      // the page's CSP has no script origin and verify-lookalike rejects any
      // script file. Astro inlines a script chunk below this limit. The limit
      // is global, so a processed image under it would become a data: URI too
      // (allowed by the CSP); one emitted as a file fails the allowlist check.
      assetsInlineLimit: 64 * 1024,
      // No script file, so no map file for it either.
      sourcemap: false,
    },
  },
});
