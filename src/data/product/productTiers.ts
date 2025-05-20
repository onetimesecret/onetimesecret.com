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
}

export const paymentFrequencies: Array<PaymentFrequency> = [
  { value: "monthly", label: "Monthly", priceSuffix: "/month" },
  { value: "annually", label: "Yearly", priceSuffix: "/year" },
];

export const productTiers: Array<ProductTier> = [
  {
    id: "tier-free",
    name: "Basic",
    href: "/plans/free",
    cta: "Get Started",
    icon: {
      collection: "heroicons",
      name: "check-circle-20-solid",
    },
    price: {
      monthly: "$0",
      annually: "$0",
    },
    description: "Essential secret sharing features casual use.",
    features: [
      "Share secrets securely",
      "Email links to recipients",
      "Automatic destruction",
      "More expiration options",
      "REST API",
    ],
    featured: false,
    frequencySuffixEnabled: false,
    learn_more: "https://docs.onetimesecret.com/en/secret-links/",
  },
  {
    id: "tier-identity",
    name: "Identity Plus",
    href: "/plans/identity",
    cta: "Start today",
    icon: {
      collection: "mdi",
      name: "shield-lock",
    },
    price: {
      monthly: "$35",
      annually: "$365",
    },
    //description: "Secure sharing that elevates your brand and simplifies communication.",
    //description: "Elevate your brand with secure sharing that simplifies communication.",
    //description: "Elevate your brand with secure, streamlined communication.",
    description:
      "Elevate brand trust with secure sharing from your own domain. e.g. secrets.example.com.",
    features: [
      "Unlimited custom domains",
      "Custom branding with your logo",
      "Branded homepage destination",
      "Privacy-first design",
      "No rate limits",
    ],
    featured: false,
    frequencySuffixEnabled: true,
    learn_more: "https://docs.onetimesecret.com/en/custom-domains/",
  },
  {
    id: "tier-dedicated",
    name: "Global Elite",
    href: "mailto:dedicated@onetimesecret.com",
    cta: "Get a Custom Quote",
    icon: {
      collection: "fa6",
      name: "solid-globe",
    },
    price: {
      monthly: "$125",
      annually: "$1150",
    },
    description: "Exclusive infrastructure in your choice of region.",
    features: [
      "Private cloud environment",
      "Fully customizable",
      "Professionally managed",
      "Helps meet and exceed compliance requirements",
    ],
    featured: true,
    frequencySuffixEnabled: false,
  },
];
