/**
 * Data constants for the HeroTitle component.
 *
 * Extracted into a shared module so both the Vue component and its
 * unit tests reference the same source of truth.
 */

/**
 * Security feature keys rendered as compliance tags beneath the hero heading.
 * Each key maps to an i18n path: `web.homepage.hero.compliance.${key}`
 */
export const SECURITY_FEATURE_KEYS = [
  "encrypted",
  "selfDestructing",
  "openSource",
  "dataResidency",
] as const;

export type SecurityFeatureKey = (typeof SECURITY_FEATURE_KEYS)[number];

/**
 * i18n key segments used in the hero heading.
 */
export const HERO_HEADING_KEYS = {
  line1: "web.homepage.hero.title.line1",
  line2_w1: "web.homepage.hero.title.line2_w1",
  line2_w2: "web.homepage.hero.title.line2_w2",
  line2_w3: "web.homepage.hero.title.line2_w3",
} as const;

/** i18n key for the hero badge text */
export const HERO_BADGE_KEY = "web.homepage.hero.badge" as const;

/** i18n key for the compliance list aria-label */
export const COMPLIANCE_LABEL_KEY =
  "web.homepage.hero.compliance.label" as const;
