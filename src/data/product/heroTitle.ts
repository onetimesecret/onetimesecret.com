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
  line2: "web.homepage.hero.title.line2",
} as const;

/**
 * Example items the hero question cycles through, in order. The first is the
 * server-rendered default and the one the cycle settles back on.
 * Each key maps to an i18n path: `web.homepage.hero.title.items.${key}`
 */
export const HERO_ITEM_KEYS = [
  "password",
  "apiKey",
  "loveLetter",
  "login",
  "timePlace",
] as const;

export type HeroItemKey = (typeof HERO_ITEM_KEYS)[number];

export const heroItemKey = (key: HeroItemKey) =>
  `web.homepage.hero.title.items.${key}` as const;

/** How long each example item stays on screen, in milliseconds. */
export const HERO_ITEM_INTERVAL_MS = 2400;

/** i18n key for the hero badge text */
export const HERO_BADGE_KEY = "web.homepage.hero.badge" as const;

/** i18n key for the compliance list aria-label */
export const COMPLIANCE_LABEL_KEY =
  "web.homepage.hero.compliance.label" as const;
