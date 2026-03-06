export interface FeatureGroup {
  labelKey: string;
  features: Array<{
    labelKey: string;
    free: boolean;
    identity: boolean;
  }>;
}

export interface PaymentFrequency {
  value: string;
  // i18n translation keys (required - single source of truth)
  labelKey: string;
  priceSuffixKey: string;
}

export interface ProductTier {
  id: string;
  href: string;

  icon: {
    collection: string;
    name: string;
  };

  featured: boolean;
  frequencySuffixEnabled?: boolean;
  learn_more?: string;

  // i18n translation keys (required - single source of truth)
  nameKey: string;
  descriptionKey: string;
  ctaKey: string;
  priceKeys: { [key: string]: string };
  featuresKeys: string[];
  badgeKey?: string;
}

export const paymentFrequencies: Array<PaymentFrequency> = [
  {
    value: "monthly",
    labelKey: "web.pricing.frequency.monthly.label",
    priceSuffixKey: "web.pricing.frequency.monthly.suffix",
  },
  {
    value: "annually",
    labelKey: "web.pricing.frequency.annually.label",
    priceSuffixKey: "web.pricing.frequency.annually.suffix",
  },
];

export const productTiers: Array<ProductTier> = [
  {
    id: "tier-free",
    nameKey: "web.pricing.tiers.basic.name",
    href: "/plans/free",
    ctaKey: "web.pricing.tiers.basic.cta",
    icon: {
      collection: "heroicons",
      name: "check-circle-20-solid",
    },
    priceKeys: {
      monthly: "web.pricing.tiers.basic.price.monthly",
      annually: "web.pricing.tiers.basic.price.annually",
    },
    descriptionKey: "web.pricing.tiers.basic.description",
    featuresKeys: [
      "web.pricing.tiers.basic.features.0",
      "web.pricing.tiers.basic.features.1",
      "web.pricing.tiers.basic.features.2",
      "web.pricing.tiers.basic.features.3",
      "web.pricing.tiers.basic.features.4",
    ],
    badgeKey: "web.pricing.tiers.basic.badge",
    featured: false,
    frequencySuffixEnabled: false,
    learn_more: "https://docs.onetimesecret.com/en/secret-links/",
  },
  {
    id: "tier-identity",
    nameKey: "web.pricing.tiers.identity.name",
    href: "/plans/identity",
    ctaKey: "web.pricing.tiers.identity.cta",
    icon: {
      collection: "mdi",
      name: "shield-lock",
    },
    priceKeys: {
      monthly: "web.pricing.tiers.identity.price.monthly",
      annually: "web.pricing.tiers.identity.price.annually",
    },
    descriptionKey: "web.pricing.tiers.identity.description",
    featuresKeys: [
      "web.pricing.tiers.identity.features.0",
      "web.pricing.tiers.identity.features.1",
      "web.pricing.tiers.identity.features.2",
      "web.pricing.tiers.identity.features.3",
      "web.pricing.tiers.identity.features.4",
    ],
    badgeKey: "web.pricing.tiers.identity.badge",
    featured: true,
    frequencySuffixEnabled: true,
    learn_more: "https://docs.onetimesecret.com/en/custom-domains/",
  },
];

export const featureGroups: FeatureGroup[] = [
  {
    labelKey: "web.pricing.groups.core-sharing",
    features: [
      {
        labelKey:
          "web.pricing.comparison.features.secret-sharing",
        free: true,
        identity: true,
      },
      {
        labelKey:
          "web.pricing.comparison.features.email-recipients",
        free: false,
        identity: true,
      },
      {
        labelKey:
          "web.pricing.comparison.features.rest-api",
        free: true,
        identity: true,
      },
    ],
  },
  {
    labelKey: "web.pricing.groups.brand-identity",
    features: [
      {
        labelKey:
          "web.pricing.comparison.features.custom-domains",
        free: false,
        identity: true,
      },
      {
        labelKey:
          "web.pricing.comparison.features.custom-branding",
        free: false,
        identity: true,
      },
    ],
  },
  {
    labelKey: "web.pricing.groups.infrastructure",
    features: [
      {
        labelKey:
          "web.pricing.comparison.features.no-rate-limits",
        free: false,
        identity: true,
      },
    ],
  },
];
