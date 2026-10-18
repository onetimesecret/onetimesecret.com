// lookalike/integration.ts
//
// Copies the brand assets the notice pages reference out of the real site's
// `public/` into the lookalike build output. astro.lookalike.config.ts sets
// `publicDir` to lookalike/public so that nothing from the real site's public
// directory ships by accident (robots.txt, sitemap.xsl, llms.txt, the
// webmanifest, the bunnycdn_errors pages). What the notice pages need is
// named here, and only this is copied.
//
// An allowlist rather than a denylist on purpose: a new file added to public/
// for the real site must not appear on the lookalike domains until someone
// decides it should. scripts/verify-lookalike.mjs checks the output against
// the same list.

import type { AstroIntegration } from "astro";
import { cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Paths relative to `public/`. A directory copies recursively.
 *
 * Fonts: OptimizedFonts.astro declares the Zilla Slab faces against /fonts/.
 * Logo: the header mark, the only image on the page.
 * Favicons: the three the notice layout links (no manifest, no tile images).
 */
export const SHARED_BRAND_ASSETS = [
  "fonts",
  "etc/img/onetime-logo-md.png",
  "favicon.ico",
  "favicon.svg",
  "favicon-32x32.png",
  "favicon-16x16.png",
  "apple-touch-icon.png",
] as const;

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export function sharedBrandAssets(): AstroIntegration {
  return {
    name: "lookalike:shared-brand-assets",
    hooks: {
      "astro:build:done": ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        for (const relative of SHARED_BRAND_ASSETS) {
          const source = join(repoRoot, "public", relative);
          if (!existsSync(source)) {
            // Fail the build rather than ship a page with a broken font or
            // logo: the whole point of the page is to look like the brand.
            throw new Error(
              `lookalike: shared asset public/${relative} does not exist`,
            );
          }
          cpSync(source, join(outDir, relative), { recursive: true });
          logger.info(`copied public/${relative}`);
        }
      },
    },
  };
}
