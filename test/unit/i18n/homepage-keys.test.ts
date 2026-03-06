/**
 * @file homepage-keys.test.ts
 * @description Unit tests for i18n key completeness (redesign/first-pass)
 *
 * Reads the actual JSON translation files via static import (resolveJsonModule).
 * No mocks, no Node built-ins — the JSON is bundled at module evaluation time
 * by Vitest's Vite-based loader, same as the production build does it.
 *
 * Verifies that all new web.homepage.* and web.footer.* keys added by the
 * redesign are present in en, fr, de, and es, and that structural parity
 * is maintained across all locales.
 *
 * Note: fr/de/es keys are English-copy stubs for the redesign phase;
 * these tests only assert key existence, not translation quality.
 */

import { describe, it, expect } from 'vitest';

import enRaw from '../../../src/i18n/ui/en.json';
import frRaw from '../../../src/i18n/ui/fr.json';
import deRaw from '../../../src/i18n/ui/de.json';
import esRaw from '../../../src/i18n/ui/es.json';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type JsonValue = string | number | boolean | null | JsonDict | JsonValue[];
type JsonDict = { [key: string]: JsonValue };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLeafPaths(obj: JsonDict, prefix = ''): string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...getLeafPaths(value as JsonDict, full));
    } else {
      paths.push(full);
    }
  }
  return paths;
}

function getNestedValue(obj: JsonDict, path: string): JsonValue | undefined {
  return path.split('.').reduce<JsonValue | undefined>((acc, segment) => {
    if (acc !== null && acc !== undefined && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as JsonDict)[segment];
    }
    return undefined;
  }, obj as JsonDict);
}

// ---------------------------------------------------------------------------
// Cast imports to the generic JsonDict type used by the helpers above.
// resolveJsonModule gives narrowly-typed shapes; we need the recursive dict.
// ---------------------------------------------------------------------------

const data: Record<string, JsonDict> = {
  en: enRaw as unknown as JsonDict,
  fr: frRaw as unknown as JsonDict,
  de: deRaw as unknown as JsonDict,
  es: esRaw as unknown as JsonDict,
};

const LANGS = ['en', 'fr', 'de', 'es'] as const;

// ---------------------------------------------------------------------------
// Required homepage keys introduced by the redesign
// ---------------------------------------------------------------------------

const REQUIRED_HOMEPAGE_KEYS = [
  // Hero section
  'web.homepage.hero.badge',
  'web.homepage.hero.title.line1',
  'web.homepage.hero.title.line2_w1',
  'web.homepage.hero.title.line2_w2',
  'web.homepage.hero.title.line2_w3',
  'web.homepage.hero.subtitle',
  'web.homepage.hero.compliance.label',
  'web.homepage.hero.compliance.encrypted',
  'web.homepage.hero.compliance.selfDestructing',
  'web.homepage.hero.compliance.openSource',
  'web.homepage.hero.compliance.dataResidency',
  // How it works
  'web.homepage.howItWorks.label',
  'web.homepage.howItWorks.title',
  'web.homepage.howItWorks.subtitle',
  'web.homepage.howItWorks.step1.title',
  'web.homepage.howItWorks.step1.description',
  'web.homepage.howItWorks.step2.title',
  'web.homepage.howItWorks.step2.description',
  'web.homepage.howItWorks.step3.title',
  'web.homepage.howItWorks.step3.description',
  // Feature highlights bento grid
  'web.homepage.featureHighlights.encryption.title',
  'web.homepage.featureHighlights.encryption.description',
  'web.homepage.featureHighlights.selfDestruction.title',
  'web.homepage.featureHighlights.selfDestruction.description',
  'web.homepage.featureHighlights.dataResidency.title',
  'web.homepage.featureHighlights.dataResidency.description',
  'web.homepage.featureHighlights.compliance.title',
  'web.homepage.featureHighlights.compliance.description',
  'web.homepage.featureHighlights.api.title',
  'web.homepage.featureHighlights.api.description',
  'web.homepage.featureHighlights.also',
  // Global infrastructure section
  'web.homepage.infrastructure.label',
  'web.homepage.infrastructure.heading',
  'web.homepage.infrastructure.description',
  'web.homepage.infrastructure.capabilitiesLabel',
  'web.homepage.infrastructure.regions.ca',
  'web.homepage.infrastructure.regions.eu',
  'web.homepage.infrastructure.regions.nz',
  'web.homepage.infrastructure.regions.uk',
  'web.homepage.infrastructure.regions.us',
  // Enterprise capability badges (referenced from FeatureHighlights)
  'web.homepage.infrastructure.features.customDomain',
  'web.homepage.infrastructure.features.sso',
  'web.homepage.infrastructure.features.auditLogs',
  // Use cases section
  'web.homepage.useCases.label',
  'web.homepage.useCases.heading',
  'web.homepage.useCases.description',
  // CTA section
  'web.homepage.cta.heading.line1',
  'web.homepage.cta.heading.line2',
  'web.homepage.cta.description',
  'web.homepage.cta.primaryButton',
  'web.homepage.cta.secondaryButton',
] as const;

const REQUIRED_FOOTER_KEYS = [
  'web.footer.columns.product',
  'web.footer.links.api',
  'web.footer.links.changelog',
  'web.footer.links.github',
  'web.footer.links.contact',
  'web.footer.links.dpa',
] as const;

const REQUIRED_NAVIGATION_KEYS = [
  'navigation.docs',
] as const;

// ---------------------------------------------------------------------------
// Suite: en.json — required keys exist and have string values
// ---------------------------------------------------------------------------

describe('en.json — homepage redesign keys present', () => {
  for (const key of REQUIRED_HOMEPAGE_KEYS) {
    it(`key "${key}" exists and is a non-empty string`, () => {
      const value = getNestedValue(data['en'], key);
      expect(value).toBeDefined();
      expect(typeof value).toBe('string');
      expect((value as string).trim().length).toBeGreaterThan(0);
    });
  }
});

describe('en.json — footer keys present', () => {
  for (const key of REQUIRED_FOOTER_KEYS) {
    it(`key "${key}" exists and is a non-empty string`, () => {
      const value = getNestedValue(data['en'], key);
      expect(value).toBeDefined();
      expect(typeof value).toBe('string');
      expect((value as string).trim().length).toBeGreaterThan(0);
    });
  }
});

describe('en.json — navigation keys present', () => {
  for (const key of REQUIRED_NAVIGATION_KEYS) {
    it(`key "${key}" exists and is a non-empty string`, () => {
      const value = getNestedValue(data['en'], key);
      expect(value).toBeDefined();
      expect(typeof value).toBe('string');
      expect((value as string).trim().length).toBeGreaterThan(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Suite: fr/de/es structural parity with en
// ---------------------------------------------------------------------------

describe('fr/de/es — homepage key structural parity with en', () => {
  const enHomepageLeaves = getLeafPaths(
    (data['en']['web'] as JsonDict)['homepage'] as JsonDict,
    'web.homepage'
  );

  for (const lang of ['fr', 'de', 'es'] as const) {
    describe(`${lang}.json`, () => {
      it('has the same number of homepage leaf keys as en', () => {
        const otherLeaves = getLeafPaths(
          (data[lang]['web'] as JsonDict)['homepage'] as JsonDict,
          'web.homepage'
        );
        expect(otherLeaves.length).toBe(enHomepageLeaves.length);
      });

      for (const key of REQUIRED_HOMEPAGE_KEYS) {
        it(`has key "${key}"`, () => {
          const value = getNestedValue(data[lang], key);
          expect(value).toBeDefined();
          expect(typeof value).toBe('string');
          expect((value as string).trim().length).toBeGreaterThan(0);
        });
      }
    });
  }
});

describe('fr/de/es — footer key structural parity with en', () => {
  for (const lang of ['fr', 'de', 'es'] as const) {
    it(`${lang}.json has all required footer keys`, () => {
      for (const key of REQUIRED_FOOTER_KEYS) {
        const value = getNestedValue(data[lang], key);
        expect(value).toBeDefined();
      }
    });
  }
});

describe('fr/de/es — navigation.docs key present', () => {
  for (const lang of ['fr', 'de', 'es'] as const) {
    it(`${lang}.json has navigation.docs`, () => {
      const value = getNestedValue(data[lang], 'navigation.docs');
      expect(value).toBeDefined();
      expect(typeof value).toBe('string');
      expect((value as string).trim().length).toBeGreaterThan(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Suite: no locales have keys that en is missing (guard against drift)
// ---------------------------------------------------------------------------

describe('i18n — no locale has homepage keys missing from en', () => {
  const enHomepageLeaves = new Set(
    getLeafPaths(
      (data['en']['web'] as JsonDict)['homepage'] as JsonDict,
      'web.homepage'
    )
  );

  for (const lang of ['fr', 'de', 'es'] as const) {
    it(`${lang}.json has no extra homepage keys vs en`, () => {
      const otherLeaves = getLeafPaths(
        (data[lang]['web'] as JsonDict)['homepage'] as JsonDict,
        'web.homepage'
      );
      const extra = otherLeaves.filter(k => !enHomepageLeaves.has(k));
      expect(extra).toHaveLength(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Suite: all four locales loaded successfully
// ---------------------------------------------------------------------------

describe('i18n — all locale files load', () => {
  for (const lang of LANGS) {
    it(`${lang}.json has a top-level "web" key`, () => {
      expect(data[lang]['web']).toBeDefined();
    });
  }
});
