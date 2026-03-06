// src/data/product/features.ts

export interface Feature {
  id: string;
  icon: string;         // Lucide icon name
  title: string;        // i18n key
  description: string;  // i18n key
  span?: 1 | 2;        // grid column span (default 1)
  iconStyle?: 'brand' | 'comp'; // icon container color variant (default 'brand')
}

export const features: Feature[] = [
  {
    id: "encryption",
    icon: "lock",
    title: "web.homepage.featureHighlights.encryption.title",
    description: "web.homepage.featureHighlights.encryption.description",
    span: 2,
  },
  {
    id: "self-destruction",
    icon: "clock",
    title: "web.homepage.featureHighlights.selfDestruction.title",
    description: "web.homepage.featureHighlights.selfDestruction.description",
  },
  {
    id: "data-residency",
    icon: "globe",
    title: "web.homepage.featureHighlights.dataResidency.title",
    description: "web.homepage.featureHighlights.dataResidency.description",
  },
  {
    id: "compliance",
    icon: "shield-check",
    title: "web.homepage.featureHighlights.compliance.title",
    description: "web.homepage.featureHighlights.compliance.description",
    span: 2,
  },
  {
    id: "api",
    icon: "code",
    title: "web.homepage.featureHighlights.api.title",
    description: "web.homepage.featureHighlights.api.description",
    iconStyle: "comp",
  },
];
