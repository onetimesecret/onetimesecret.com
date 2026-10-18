/**
 * @file integration.test.ts
 * @description Unit tests for lookalike/integration.ts: the brand-asset
 * allowlist the second build copies out of public/ and the dev server serves
 * from it. Pins that every listed asset exists (a rename under public/ must
 * fail here, not at deploy time), that the allowlist matches files exactly and
 * directories by prefix, that URL paths cannot step outside it, and that the
 * build hook refuses to run with an asset missing.
 *
 * @vitest-environment node
 */

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_PUBLIC_DIR,
  isSharedBrandAsset,
  SHARED_BRAND_ASSETS,
  sharedBrandAssetFile,
  sharedBrandAssets,
} from "../../../lookalike/integration";

let publicDir: string;
let outDir: string;

/** A public/ with every allowlisted asset present, fonts as a directory. */
function writePublic(dir: string) {
  for (const asset of SHARED_BRAND_ASSETS) {
    const path = join(dir, asset);
    if (asset === "fonts") {
      mkdirSync(path, { recursive: true });
      writeFileSync(join(path, "Zilla.woff2"), "font");
    } else {
      mkdirSync(join(path, ".."), { recursive: true });
      writeFileSync(path, asset);
    }
  }
}

beforeEach(() => {
  publicDir = mkdtempSync(join(tmpdir(), "lookalike-public-"));
  outDir = mkdtempSync(join(tmpdir(), "lookalike-out-"));
  writePublic(publicDir);
});

afterEach(() => {
  rmSync(publicDir, { recursive: true, force: true });
  rmSync(outDir, { recursive: true, force: true });
});

describe("SHARED_BRAND_ASSETS", () => {
  it("names assets that exist under the real public/", () => {
    for (const asset of SHARED_BRAND_ASSETS) {
      expect(existsSync(join(DEFAULT_PUBLIC_DIR, asset)), asset).toBe(true);
    }
  });
});

describe("isSharedBrandAsset", () => {
  it("matches a listed file exactly and a listed directory by prefix", () => {
    expect(isSharedBrandAsset("favicon.svg", publicDir)).toBe(true);
    expect(isSharedBrandAsset("etc/img/onetime-logo-md.png", publicDir)).toBe(
      true,
    );
    expect(isSharedBrandAsset("fonts/Zilla.woff2", publicDir)).toBe(true);
    expect(isSharedBrandAsset("fonts/sub/Zilla.woff2", publicDir)).toBe(true);
  });

  it("does not let a longer name ride on a listed file", () => {
    expect(isSharedBrandAsset("favicon.svg.bak", publicDir)).toBe(false);
    expect(isSharedBrandAsset("apple-touch-icon.png.gz", publicDir)).toBe(
      false,
    );
    expect(isSharedBrandAsset("fonts", publicDir)).toBe(false);
    expect(isSharedBrandAsset("fontsx/Zilla.woff2", publicDir)).toBe(false);
    expect(isSharedBrandAsset("etc/img/other.png", publicDir)).toBe(false);
  });
});

describe("sharedBrandAssetFile", () => {
  it("resolves an allowlisted URL path to the file under public/", () => {
    expect(sharedBrandAssetFile("/favicon.svg", publicDir)).toBe(
      join(publicDir, "favicon.svg"),
    );
    expect(sharedBrandAssetFile("/fonts/Zilla.woff2", publicDir)).toBe(
      join(publicDir, "fonts", "Zilla.woff2"),
    );
    expect(sharedBrandAssetFile("/fonts/Zilla%2Ewoff2", publicDir)).toBe(
      join(publicDir, "fonts", "Zilla.woff2"),
    );
  });

  it("returns null for anything else, including traversal and missing files", () => {
    expect(sharedBrandAssetFile("/", publicDir)).toBeNull();
    expect(sharedBrandAssetFile("/robots.txt", publicDir)).toBeNull();
    expect(sharedBrandAssetFile("/fonts/", publicDir)).toBeNull();
    expect(sharedBrandAssetFile("/fonts/missing.woff2", publicDir)).toBeNull();
    expect(
      sharedBrandAssetFile("/fonts/../favicon.svg.bak", publicDir),
    ).toBeNull();
    expect(
      sharedBrandAssetFile("/fonts/../../etc/passwd", publicDir),
    ).toBeNull();
    expect(sharedBrandAssetFile("/%ZZ", publicDir)).toBeNull();
  });
});

describe("sharedBrandAssets build hook", () => {
  const logger = { info: () => {} } as unknown as Parameters<
    NonNullable<
      ReturnType<typeof sharedBrandAssets>["hooks"]["astro:build:done"]
    >
  >[0]["logger"];

  function runBuildDone(dir: string) {
    const hook = sharedBrandAssets(dir).hooks["astro:build:done"];
    if (!hook) throw new Error("no astro:build:done hook");
    return hook({
      dir: pathToFileURL(`${outDir}/`),
      logger,
    } as unknown as Parameters<typeof hook>[0]);
  }

  it("copies every listed asset into the output", () => {
    runBuildDone(publicDir);
    expect(readFileSync(join(outDir, "favicon.svg"), "utf8")).toBe(
      "favicon.svg",
    );
    expect(readFileSync(join(outDir, "fonts", "Zilla.woff2"), "utf8")).toBe(
      "font",
    );
    expect(existsSync(join(outDir, "etc", "img", "onetime-logo-md.png"))).toBe(
      true,
    );
  });

  it("fails the build when a listed asset is missing", () => {
    rmSync(join(publicDir, "favicon.svg"));
    expect(() => runBuildDone(publicDir)).toThrow(
      /shared asset public\/favicon\.svg does not exist/,
    );
  });
});
