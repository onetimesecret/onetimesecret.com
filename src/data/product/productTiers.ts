export interface PaymentFrequency {
  value: string;
  label: string;
  priceSuffix: string;
}

export interface ProductTier {
  id: string;
  name: string;
  href: string;
  cta: string;

  icon: {
    collection: string;
    name: string;
  };

  price: { [key: string]: string };
  description: string;
  features: string[];
  featured: boolean;
  frequencySuffixEnabled?: boolean;
  learn_more?: string;

  // i18n translation keys
  nameKey?: string;
  descriptionKey?: string;
  ctaKey?: string;
  featuresKeys?: string[];
}

export const paymentFrequencies: Array<PaymentFrequency> = [
  { value: "monthly", label: "Monthly", priceSuffix: "/month" },
  { value: "annually", label: "Yearly", priceSuffix: "/year" },
];

export const productTiers: Array<ProductTier> = [
  {
    id: "tier-free",
    name: "Basic",
    nameKey: "web.pricing.tiers.basic.name",
    href: "/plans/free",
    cta: "Get Started",
    ctaKey: "web.pricing.tiers.basic.cta",
    icon: {
      collection: "heroicons",
      name: "check-circle-20-solid",
    },
    price: {
      monthly: "$0",
      annually: "$0",
    },
    description: "Essential secret sharing features casual use.",
    descriptionKey: "web.pricing.tiers.basic.description",
    features: [
      "Share secrets securely",
      "Email links to recipients",
      "Automatic destruction",
      "More expiration options",
      "REST API",
    ],
    featuresKeys: [
      "web.pricing.tiers.basic.features.0",
      "web.pricing.tiers.basic.features.1",
      "web.pricing.tiers.basic.features.2",
      "web.pricing.tiers.basic.features.3",
      "web.pricing.tiers.basic.features.4",
    ],
    featured: false,
    frequencySuffixEnabled: false,
    learn_more: "https://docs.onetimesecret.com/en/secret-links/",
  },
  {
    id: "tier-identity",
    name: "Identity Plus",
    nameKey: "web.pricing.tiers.identity.name",
    href: "/plans/identity",
    cta: "Start today",
    ctaKey: "web.pricing.tiers.identity.cta",
    icon: {
      collection: "mdi",
      name: "shield-lock",
    },
    price: {
      monthly: "$35",
      annually: "$365",
    },
    description:
      "Elevate brand trust with secure sharing from your own domain. e.g. secrets.example.com.",
    descriptionKey: "web.pricing.tiers.identity.description",
    features: [
      "Unlimited custom domains",
      "Custom branding with your logo",
      "Branded homepage destination",
      "Privacy-first design",
      "No rate limits",
    ],
    featuresKeys: [
      "web.pricing.tiers.identity.features.0",
      "web.pricing.tiers.identity.features.1",
      "web.pricing.tiers.identity.features.2",
      "web.pricing.tiers.identity.features.3",
      "web.pricing.tiers.identity.features.4",
    ],
    featured: true,
    frequencySuffixEnabled: true,
    learn_more: "https://docs.onetimesecret.com/en/custom-domains/",
  },
];
