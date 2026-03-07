// src/data/product/regionPricing.ts

/**
 * Regional pricing configuration.
 * Maps jurisdiction identifiers to currency and price amounts.
 * Prices are keyed by tier ID and payment frequency, so adding
 * new tiers only requires adding entries to each region's prices.
 */

export interface RegionCurrencyConfig {
  /** ISO 4217 currency code */
  currencyCode: string;
  /** Prices: tier ID → frequency → numeric amount */
  prices: Record<string, Record<string, number>>;
}

/**
 * Region-to-pricing mapping.
 * Update amounts to reflect actual Stripe pricing per currency.
 */
export const regionPricing: Record<string, RegionCurrencyConfig> = {
  EU: {
    currencyCode: 'EUR',
    prices: {
      'tier-free': { monthly: 0, annually: 0 },
      'tier-identity': { monthly: 35, annually: 356 },
    },
  },
  US: {
    currencyCode: 'USD',
    prices: {
      'tier-free': { monthly: 0, annually: 0 },
      'tier-identity': { monthly: 35, annually: 356 },
    },
  },
  CA: {
    currencyCode: 'CAD',
    prices: {
      'tier-free': { monthly: 0, annually: 0 },
      'tier-identity': { monthly: 35, annually: 356 },
    },
  },
  UK: {
    currencyCode: 'GBP',
    prices: {
      'tier-free': { monthly: 0, annually: 0 },
      'tier-identity': { monthly: 35, annually: 356 },
    },
  },
  NZ: {
    currencyCode: 'NZD',
    prices: {
      'tier-free': { monthly: 0, annually: 0 },
      'tier-identity': { monthly: 35, annually: 356 },
    },
  },
  BR: {
    currencyCode: 'BRL',
    prices: {
      'tier-free': { monthly: 0, annually: 0 },
      'tier-identity': { monthly: 35, annually: 356 },
    },
  },
  AU: {
    currencyCode: 'AUD',
    prices: {
      'tier-free': { monthly: 0, annually: 0 },
      'tier-identity': { monthly: 35, annually: 356 },
    },
  },
  MX: {
    currencyCode: 'MXN',
    prices: {
      'tier-free': { monthly: 0, annually: 0 },
      'tier-identity': { monthly: 35, annually: 356 },
    },
  },
};

/** Fallback when a region identifier is not found */
export const defaultPricing: RegionCurrencyConfig =
  regionPricing['US'];

/**
 * Format a numeric amount with locale-aware currency symbol.
 * e.g. formatPrice(35, 'EUR', 'de') → "35 €"
 *      formatPrice(35, 'USD', 'en') → "$35"
 */
export function formatPrice(
  amount: number,
  currencyCode: string,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Look up and format a tier's price for a given region and frequency.
 */
export function getRegionPrice(
  regionId: string,
  tierId: string,
  frequency: string,
  locale: string,
): string {
  const config = regionPricing[regionId] ?? defaultPricing;
  const amount = config.prices[tierId]?.[frequency] ?? 0;
  return formatPrice(amount, config.currencyCode, locale);
}
