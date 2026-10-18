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
// the same list through `isSharedBrandAsset`.
//
// `astro dev` serves publicDir and nothing else, so the same allowlist is
// served from public/ by a dev-server middleware; without it the fonts, logo
// and favicons 404 under `pnpm dev:lookalike`.

import type { AstroIntegration } from "astro";
import { cpSync, createReadStream, existsSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, sep } from "node:path";
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

/** The real site's public directory, where the allowlist is read from. */
export const DEFAULT_PUBLIC_DIR = join(repoRoot, "public");

function isDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

/**
 * Whether `file`, a `/`-separated path relative to the output root, is on the
 * allowlist: a listed file exactly, or anything under a listed directory. A
 * prefix match on a file name is not enough: `favicon.svg.bak` is not
 * `favicon.svg`.
 */
export function isSharedBrandAsset(
  file: string,
  publicDir: string = DEFAULT_PUBLIC_DIR,
): boolean {
  return SHARED_BRAND_ASSETS.some((asset) =>
    isDirectory(join(publicDir, asset))
      ? file.startsWith(`${asset}/`)
      : file === asset,
  );
}

const CONTENT_TYPES: Record<string, string> = {
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};

/**
 * The file under `publicDir` that URL `pathname` names, or null when it is
 * not an allowlisted asset. Normalised before the check so `..` cannot step
 * outside a listed directory, and the result must be a file that exists.
 */
export function sharedBrandAssetFile(
  pathname: string,
  publicDir: string = DEFAULT_PUBLIC_DIR,
): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const file = normalize(decoded.replace(/^\/+/, "")).split(sep).join("/");
  if (file.startsWith("../") || !isSharedBrandAsset(file, publicDir)) {
    return null;
  }
  const source = join(publicDir, file);
  return existsSync(source) && statSync(source).isFile() ? source : null;
}

export function sharedBrandAssets(
  publicDir: string = DEFAULT_PUBLIC_DIR,
): AstroIntegration {
  return {
    name: "lookalike:shared-brand-assets",
    hooks: {
      "astro:server:setup": ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
          const source = sharedBrandAssetFile(pathname, publicDir);
          if (!source) return next();
          res.setHeader(
            "Content-Type",
            CONTENT_TYPES[extname(source)] ?? "application/octet-stream",
          );
          createReadStream(source).on("error", next).pipe(res);
        });
      },
      "astro:build:done": ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        for (const relative of SHARED_BRAND_ASSETS) {
          const source = join(publicDir, relative);
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
