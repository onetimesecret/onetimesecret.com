/**
 * @file locale-completeness.test.ts
 * @description Guards against translation drift across the locale files.
 *
 * Reads the real JSON in src/i18n/ui via static import (resolveJsonModule),
 * the same way the production build and homepage-keys.test.ts do.
 *
 * Two invariants are enforced:
 *
 *   1. Structural parity — every locale (de, es, fr) exposes exactly the same
 *      set of leaf keys as the English source (en.json), which is the canonical
 *      schema and the i18n fallback locale. Missing or extra keys fail.
 *
 *   2. No untranslated stubs — a locale value must not be a byte-for-byte copy
 *      of the English string, unless the key is explicitly allow-listed (brand
 *      names, technical terms, or words spelled identically in the target
 *      language). This catches the most common failure mode: a key added to
 *      en.json and copy-pasted into the other locales "to translate later",
 *      which then silently ships English to localized visitors.
 *
 * Scope / limitations: this verifies *presence* of a translation, not its
 * semantic accuracy, and it does not detect translations that have gone stale
 * relative to a reworded English source (that requires human review).
 *
 * ---------------------------------------------------------------------------
 * TRANSITIONAL BASELINE
 * ---------------------------------------------------------------------------
 * `KNOWN_UNTRANSLATED` lists keys that were still English copies when this
 * guard was introduced. They are fixed in PR #152. The baseline lets the rule
 * land without blocking on that work: existing copies are tolerated, but no
 * NEW untranslated key may be added. The baseline may only shrink — once a key
 * is translated its entry becomes inert and should be deleted. Do not add to it;
 * translate the string or, if it is intentionally identical to English, add it
 * to `ALLOWED_IDENTICAL` instead.
 */

import { describe, it, expect } from "vitest";

import enRaw from "../../../src/i18n/ui/en.json";
import frRaw from "../../../src/i18n/ui/fr.json";
import deRaw from "../../../src/i18n/ui/de.json";
import esRaw from "../../../src/i18n/ui/es.json";

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

type JsonValue = string | number | boolean | null | JsonDict | JsonValue[];
type JsonDict = { [key: string]: JsonValue };
type Lang = "de" | "es" | "fr";

function getLeaves(obj: JsonDict, prefix = ""): Record<string, JsonValue> {
  const out: Record<string, JsonValue> = {};
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, getLeaves(value as JsonDict, full));
    } else {
      out[full] = value;
    }
  }
  return out;
}

const en = getLeaves(enRaw as unknown as JsonDict);
const locales: Record<Lang, Record<string, JsonValue>> = {
  de: getLeaves(deRaw as unknown as JsonDict),
  es: getLeaves(esRaw as unknown as JsonDict),
  fr: getLeaves(frRaw as unknown as JsonDict),
};
const LANGS: Lang[] = ["de", "es", "fr"];

// ---------------------------------------------------------------------------
// Permanent allow-list: keys intentionally identical to English.
// ---------------------------------------------------------------------------

// Shared across every locale: brand name and universal technical terms.
const ALLOWED_COMMON = [
  "onetime-secret-literal",
  "navigation.docs",
  "LABELS.blog",
  "web.pricing.tiers.identity.name", // "Identity Plus" — product name
  "web.footer.links.api",
  "web.footer.links.changelog",
  "web.footer.links.github",
  "web.footer.links.dpa",
  "web.homepage.hero.title.line1", // "Onetime Secret" — brand wordmark
  "web.homepage.infrastructure.features.sso", // "SSO / SAML"
];

// Per-locale: words that happen to be spelled the same in that language, or
// terms that locale keeps in English by convention.
const ALLOWED_BY_LANG: Record<Lang, string[]> = {
  de: [
    "status", // "Status"
    "web.pricing.region", // "Region"
    "web.secrets.passphraseInputLabel", // "Passphrase" — used as-is in de copy
    "web.useCases.itdevops.title", // "IT & DevOps"
    "web.useCases.hr.title", // "HR & People Ops"
    "web.footer.links.selfHosting", // "Self-Hosting"
  ],
  es: [
    // Currency display strings — identical across locales by current convention.
    "web.pricing.tiers.basic.price.monthly",
    "web.pricing.tiers.basic.price.annually",
    "web.pricing.tiers.identity.price.monthly",
    "web.pricing.tiers.identity.price.annually",
  ],
  fr: [
    "LABELS.docs", // "Documentation"
    "web.pricing.groups.infrastructure", // "Infrastructure"
    "web.secrets.europe", // "Europe"
    "web.secrets.ttl.5minutes", // "5 minutes"
    "web.secrets.ttl.30minutes", // "30 minutes"
    "web.useCases.itdevops.title", // "IT & DevOps"
    "web.footer.links.contact", // "Contact"
    "web.footer.links.guides", // "Guides"
    "web.homepage.hero.compliance.openSource", // "Open source"
    "web.homepage.infrastructure.regions.ca", // "Toronto, Canada"
  ],
};

const allowedFor = (lang: Lang): Set<string> =>
  new Set([...ALLOWED_COMMON, ...ALLOWED_BY_LANG[lang]]);

// ---------------------------------------------------------------------------
// Transitional baseline: English copies present when this guard was added.
// Tracked in PR #152. May only shrink — see the file header.
// ---------------------------------------------------------------------------

const KNOWN_UNTRANSLATED: Record<Lang, string[]> = {
  de: [
    "web.errors.apiGenericErrorHomepage",
    "web.errors.apiGenericError",
    "web.useCases.itdevops.description",
    "web.useCases.consultants.title",
    "web.useCases.consultants.description",
    "web.footer.columns.product",
    "web.footer.links.contact",
    "web.homepage.hero.title.line2_w1",
    "web.homepage.hero.title.line2_w2",
    "web.homepage.hero.title.line2_w3",
    "web.homepage.features.label",
    "web.homepage.features.heading",
    "web.homepage.features.description",
    "web.homepage.useCases.label",
    "web.homepage.useCases.heading",
    "web.homepage.useCases.description",
    "web.homepage.infrastructure.label",
    "web.homepage.infrastructure.heading",
    "web.homepage.infrastructure.description",
    "web.homepage.infrastructure.capabilitiesLabel",
    "web.homepage.infrastructure.features.customDomain",
    "web.homepage.infrastructure.features.auditLogs",
    "web.homepage.cta.heading.line1",
    "web.homepage.cta.heading.line2",
    "web.homepage.cta.primaryButton",
    "web.homepage.cta.secondaryButton",
    "changelog.category-release",
    "changelog.category-news",
  ],
  es: [
    "web.errors.apiGenericErrorHomepage",
    "web.errors.apiGenericError",
    "web.useCases.itdevops.title",
    "web.useCases.itdevops.description",
    "web.useCases.consultants.title",
    "web.useCases.consultants.description",
    "web.footer.columns.product",
    "web.footer.links.contact",
    "web.homepage.hero.title.line2_w1",
    "web.homepage.hero.title.line2_w2",
    "web.homepage.hero.title.line2_w3",
    "web.homepage.features.label",
    "web.homepage.features.heading",
    "web.homepage.features.description",
    "web.homepage.useCases.label",
    "web.homepage.useCases.heading",
    "web.homepage.useCases.description",
    "web.homepage.infrastructure.label",
    "web.homepage.infrastructure.heading",
    "web.homepage.infrastructure.description",
    "web.homepage.infrastructure.capabilitiesLabel",
    "web.homepage.infrastructure.features.customDomain",
    "web.homepage.infrastructure.features.auditLogs",
    "web.homepage.cta.heading.line1",
    "web.homepage.cta.heading.line2",
    "web.homepage.cta.primaryButton",
    "web.homepage.cta.secondaryButton",
  ],
  fr: [
    "web.errors.apiGenericErrorHomepage",
    "web.errors.apiGenericError",
    "web.useCases.itdevops.description",
    "web.useCases.consultants.title",
    "web.useCases.consultants.description",
    "web.footer.columns.product",
    "web.homepage.hero.title.line2_w1",
    "web.homepage.hero.title.line2_w2",
    "web.homepage.hero.title.line2_w3",
    "web.homepage.features.label",
    "web.homepage.features.heading",
    "web.homepage.features.description",
    "web.homepage.useCases.label",
    "web.homepage.useCases.heading",
    "web.homepage.useCases.description",
    "web.homepage.infrastructure.label",
    "web.homepage.infrastructure.heading",
    "web.homepage.infrastructure.description",
    "web.homepage.infrastructure.capabilitiesLabel",
    "web.homepage.infrastructure.features.customDomain",
    "web.homepage.infrastructure.features.auditLogs",
    "web.homepage.cta.heading.line1",
    "web.homepage.cta.heading.line2",
    "web.homepage.cta.primaryButton",
    "web.homepage.cta.secondaryButton",
  ],
};

// ---------------------------------------------------------------------------
// 1. Structural parity
// ---------------------------------------------------------------------------

describe("i18n — structural parity with en.json", () => {
  const enKeys = Object.keys(en).sort();

  for (const lang of LANGS) {
    describe(`${lang}.json`, () => {
      const langKeys = Object.keys(locales[lang]);

      it("has no keys missing relative to en", () => {
        const missing = enKeys.filter((k) => !(k in locales[lang]));
        expect(missing, `keys missing from ${lang}.json`).toEqual([]);
      });

      it("has no keys that en does not have", () => {
        const enSet = new Set(enKeys);
        const extra = langKeys.filter((k) => !enSet.has(k));
        expect(extra, `keys in ${lang}.json but not en.json`).toEqual([]);
      });
    });
  }
});

// ---------------------------------------------------------------------------
// 2. No untranslated stubs (the ratchet)
// ---------------------------------------------------------------------------

describe("i18n — no new untranslated stubs", () => {
  for (const lang of LANGS) {
    it(`${lang}.json introduces no English copies outside the baseline`, () => {
      const allowed = allowedFor(lang);
      const baseline = new Set(KNOWN_UNTRANSLATED[lang]);

      const newStubs: string[] = [];
      for (const [key, value] of Object.entries(locales[lang])) {
        if (typeof value !== "string" || typeof en[key] !== "string") continue;
        if (value !== en[key]) continue; // translated (or different) — fine
        if (allowed.has(key) || baseline.has(key)) continue; // known/intentional
        newStubs.push(key);
      }

      expect(
        newStubs,
        `${lang}.json copies these keys verbatim from English. Translate them, ` +
          `or if the value is intentionally identical add the key to ` +
          `ALLOWED_IDENTICAL in this file.`,
      ).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// 3. Self-consistency of the allow-list and baseline (keeps the lists honest)
// ---------------------------------------------------------------------------

describe("i18n — drift-guard lists reference real keys", () => {
  for (const lang of LANGS) {
    it(`${lang}: every allow-listed / baseline key exists in en.json`, () => {
      const unknown = [...allowedFor(lang), ...KNOWN_UNTRANSLATED[lang]].filter(
        (k) => !(k in en),
      );
      expect(unknown, `keys that no longer exist in en.json`).toEqual([]);
    });

    it(`${lang}: no key is in both the allow-list and the baseline`, () => {
      const allowed = allowedFor(lang);
      const overlap = KNOWN_UNTRANSLATED[lang].filter((k) => allowed.has(k));
      expect(
        overlap,
        `keys listed as both intentional and untranslated`,
      ).toEqual([]);
    });
  }
});
