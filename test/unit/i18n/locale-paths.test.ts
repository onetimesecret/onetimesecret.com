/**
 * @file locale-paths.test.ts
 * @description The path rules behind the canonical and hreflang tags:
 * stripLocalePrefix() must match locale prefixes by whole segment,
 * hasLocalizedVariants() decides whether a page has a locale cluster to annotate
 * at all, isLocalePrefixed() separates a locale-prefixed path from the root, and
 * resolveXDefaultPath() decides which URL the cluster's x-default names.
 *
 * The canonical, og:url and hreflang tags in LayoutHead.astro are built by
 * stripping the locale segment off the current path and re-prefixing it once per
 * locale. That strip used to be written inline, and got it wrong twice in ways a
 * built-page test could only catch one page at a time:
 *
 *   - its prefix list was hand-written and omitted "es", so no Spanish path
 *     counted as prefixed and every /es/ page advertised doubled URLs that 404
 *     (/en/es/about/, /es/es/about/);
 *   - its match was `startsWith("/en")` with no segment boundary and its strip a
 *     fixed `substring(3)`, so "/env-debug/" became "/frv-debug/" and an x-default
 *     of "https://onetimesecret.comv-debug/".
 *
 * Both are the same failure: a prefix test that does not agree with how paths are
 * segmented. These cases pin that down directly, rather than only through a
 * built preview, and they fail for any locale code that is not two characters.
 *
 * Trailing slashes are significant here and deliberately preserved. Astro's
 * default `build.format: 'directory'` makes "/about/" the URL that returns 200
 * while "/about" redirects to it, so the tags must name the form with the slash.
 * That is the one thing that rules out getPathWithoutLocale(), which normalizes
 * it away for its own callers.
 */

import { describe, expect, it } from 'vitest';

import { SUPPORTED_LANGUAGES } from '@config/astro/i18n';
import {
  getPathWithoutLocale,
  hasLocalizedVariants,
  isLocalePrefixed,
  resolveXDefaultPath,
  stripLocalePrefix,
} from '@/i18n/utils';

/**
 * Pages that render from src/pages/*.astro rather than src/pages/[lang]/, so
 * nothing exists at /{lang}{path}. Each of these advertised four alternates
 * that 404 before #211; /privacy/ and /terms/ are footer-linked sitewide.
 */
const UNLOCALIZED_PAGES = [
  '/privacy/',
  '/terms/',
  '/example/',
  '/env-debug/',
  '/test-layout/',
];

describe('stripLocalePrefix', () => {
  it('strips a locale segment and keeps the trailing slash', () => {
    expect(stripLocalePrefix('/en/about/')).toBe('/about/');
    expect(stripLocalePrefix('/es/about/')).toBe('/about/');
    expect(stripLocalePrefix('/de/pricing/')).toBe('/pricing/');
  });

  it('strips a locale segment from a path with no trailing slash', () => {
    expect(stripLocalePrefix('/fr/about')).toBe('/about');
  });

  it('handles every supported language, not a hand-picked subset', () => {
    // "es" was the one missing from the hand-written list.
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(stripLocalePrefix(`/${lang}/about/`)).toBe('/about/');
    }
  });

  it('reduces a bare locale root to "/"', () => {
    expect(stripLocalePrefix('/en')).toBe('/');
    expect(stripLocalePrefix('/en/')).toBe('/');
  });

  it('leaves a path alone when its first segment only begins with a locale code', () => {
    // The live bug: "/env-debug/" matched the "/en" prefix test.
    expect(stripLocalePrefix('/env-debug/')).toBe('/env-debug/');
    expect(stripLocalePrefix('/english/')).toBe('/english/');
    expect(stripLocalePrefix('/design/')).toBe('/design/');
    expect(stripLocalePrefix('/estimates/')).toBe('/estimates/');
  });

  it('leaves an unprefixed path alone', () => {
    expect(stripLocalePrefix('/')).toBe('/');
    expect(stripLocalePrefix('/pricing/')).toBe('/pricing/');
    expect(stripLocalePrefix('/about/team/')).toBe('/about/team/');
  });

  it('strips only the first locale segment', () => {
    // A doubled prefix is what the broken version emitted; if one is ever
    // requested, exactly one segment comes off.
    expect(stripLocalePrefix('/es/es/about/')).toBe('/es/about/');
  });

  it('returns "/" for an empty path', () => {
    expect(stripLocalePrefix('')).toBe('/');
  });

  it('differs from getPathWithoutLocale only in the trailing slash', () => {
    // Documents why both exist. If this ever stops holding, one of them moved.
    expect(getPathWithoutLocale('/es/about/')).toBe('/about');
    expect(stripLocalePrefix('/es/about/')).toBe('/about/');
  });
});

describe('hasLocalizedVariants', () => {
  it('is true for a locale-prefixed path, in every supported language', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(hasLocalizedVariants(`/${lang}/about/`)).toBe(true);
      expect(hasLocalizedVariants(`/${lang}/`)).toBe(true);
      expect(hasLocalizedVariants(`/${lang}`)).toBe(true);
    }
  });

  it('is true for the root', () => {
    // "/" carries no locale segment but its twins exist: src/pages/index.astro
    // serves it as the language-neutral entry point and [lang]/index.astro serves
    // /en/, /fr/, /de/ and /es/. Those alternates resolve, so they stay.
    expect(hasLocalizedVariants('/')).toBe(true);
    expect(hasLocalizedVariants('')).toBe(true);
  });

  it('is false for a page that has no localized counterpart', () => {
    // The twenty dead URLs in #211, five pages at four alternates each.
    for (const path of UNLOCALIZED_PAGES) {
      expect(hasLocalizedVariants(path), path).toBe(false);
    }
  });

  it('is false for a first segment that merely begins with a locale code', () => {
    // Same boundary as stripLocalePrefix: admitting "/env-debug/" here would put
    // back the four dead alternates on it, as well as the mangled x-default.
    expect(hasLocalizedVariants('/env-debug/')).toBe(false);
    expect(hasLocalizedVariants('/english/')).toBe(false);
    expect(hasLocalizedVariants('/design/')).toBe(false);
    expect(hasLocalizedVariants('/estimates/')).toBe(false);
  });

  it('yields one distinct, singly-prefixed alternate per locale', () => {
    // Composed the way LayoutHead.astro composes them, because the composition is
    // where both earlier defects surfaced: /es/about/ emitted /en/es/about/ and
    // /es/es/about/, and /env-debug/ emitted /frv-debug/. Stripping each result
    // must land back on the bare path, which is false for any doubled prefix.
    const path = '/es/about/';
    expect(hasLocalizedVariants(path)).toBe(true);

    const basePath = stripLocalePrefix(path);
    const urls = SUPPORTED_LANGUAGES.map((lang) => `/${lang}${basePath}`);

    expect(new Set(urls).size).toBe(SUPPORTED_LANGUAGES.length);
    for (const url of urls) {
      expect(stripLocalePrefix(url), url).toBe('/about/');
    }
  });
});

describe('isLocalePrefixed', () => {
  it('is true for a path under a locale segment', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(isLocalePrefixed(`/${lang}/about/`)).toBe(true);
      expect(isLocalePrefixed(`/${lang}/`)).toBe(true);
      expect(isLocalePrefixed(`/${lang}`)).toBe(true);
    }
  });

  it('is false for the root and for any unprefixed path', () => {
    expect(isLocalePrefixed('/')).toBe(false);
    expect(isLocalePrefixed('')).toBe(false);
    for (const path of UNLOCALIZED_PAGES) {
      expect(isLocalePrefixed(path), path).toBe(false);
    }
  });

  it('is false for a first segment that merely begins with a locale code', () => {
    expect(isLocalePrefixed('/env-debug/')).toBe(false);
    expect(isLocalePrefixed('/english/')).toBe(false);
  });

  it('differs from hasLocalizedVariants only at the root and the empty path', () => {
    // This is the whole reason both exist. "/" has localized siblings, so it gets
    // per-locale alternates; it is also the language-neutral page itself, so its
    // x-default is "/" rather than "/en/". Everywhere else the two agree.
    //
    // The empty path splits them the same way. LayoutHead always passes at least
    // "/" (Astro.url.pathname), so that pair is an artefact of guarding both
    // functions rather than a case the site reaches.
    expect(hasLocalizedVariants('/')).toBe(true);
    expect(isLocalePrefixed('/')).toBe(false);
    expect(hasLocalizedVariants('')).toBe(true);
    expect(isLocalePrefixed('')).toBe(false);

    for (const path of [...UNLOCALIZED_PAGES, '/en/about/', '/es/', '/fr/x/y/']) {
      expect(isLocalePrefixed(path), path).toBe(hasLocalizedVariants(path));
    }
  });
});

describe('resolveXDefaultPath', () => {
  it('names the page itself when the page is already language-neutral', () => {
    // /privacy/ is the version for every language, and unlike /en/privacy/ it
    // exists. These pages carry no per-locale alternates at all.
    for (const path of UNLOCALIZED_PAGES) {
      expect(resolveXDefaultPath(path), path).toBe(path);
    }
  });

  it('names the default-locale sibling for a locale-prefixed page', () => {
    // Guaranteed to exist, because the page asking is itself in the cluster. The
    // unprefixed path is not: /changelog/<entry>/ is never built, and where a
    // top-level redirect does cover one it is a meta-refresh stub, not a page.
    expect(resolveXDefaultPath('/es/about/')).toBe('/en/about/');
    expect(resolveXDefaultPath('/fr/changelog/2026-01-01-x/')).toBe(
      '/en/changelog/2026-01-01-x/'
    );
    expect(resolveXDefaultPath('/de/use-cases/')).toBe('/en/use-cases/');
  });

  it('names "/" for the homepage cluster', () => {
    // src/pages/index.astro serves "/" language-neutrally, so the cluster defers
    // to it. Naming /en/ here is what broke agreement: "/" named itself while the
    // four locale homepages named /en/.
    expect(resolveXDefaultPath('/')).toBe('/');
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(resolveXDefaultPath(`/${lang}/`), lang).toBe('/');
      expect(resolveXDefaultPath(`/${lang}`), lang).toBe('/');
    }
  });

  it('gives every member of a cluster the same x-default', () => {
    // The invariant that regressed, as a property over paths rather than five
    // page loads: pages sharing a set of alternates are one cluster, and a
    // cluster that disagrees about x-default describes two different sets.
    for (const basePath of ['/', '/about/', '/changelog/', '/use-cases/x/']) {
      const cluster = [
        ...SUPPORTED_LANGUAGES.map((lang) =>
          basePath === '/' ? `/${lang}/` : `/${lang}${basePath}`
        ),
        // The unprefixed page belongs to the cluster only at the root, where it
        // is a real page rather than a redirect.
        ...(basePath === '/' ? ['/'] : []),
      ];

      const resolved = new Set(cluster.map(resolveXDefaultPath));

      expect(resolved.size, `${basePath} -> ${[...resolved].join(', ')}`).toBe(1);
    }
  });

  it('leaves a path alone when its first segment only begins with a locale code', () => {
    expect(resolveXDefaultPath('/env-debug/')).toBe('/env-debug/');
    expect(resolveXDefaultPath('/english/')).toBe('/english/');
  });

  it('returns "/" for an empty path', () => {
    expect(resolveXDefaultPath('')).toBe('/');
  });
});
