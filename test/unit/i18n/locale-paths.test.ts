/**
 * @file locale-paths.test.ts
 * @description stripLocalePrefix() must match locale prefixes by whole segment.
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
import { getPathWithoutLocale, stripLocalePrefix } from '@/i18n/utils';

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
