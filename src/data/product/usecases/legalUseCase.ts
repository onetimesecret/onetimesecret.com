import { type UseCase } from "@/types/useCase";

export function getLegalUseCase(t: (key: string) => string): UseCase {
  // Legal team example secret
  const exampleSecret = `Access code for case file #2024-0847:
Rg22mK9x`;

  return {
    id: "legal",
    title: t("web.useCases.legal.title"),
    icon: "⚖️",
    description: t("web.useCases.legal.description"),
    exampleSecret: exampleSecret,
    benefits: [
      t("web.useCases.legal.benefits.1"),
      t("web.useCases.legal.benefits.2"),
      t("web.useCases.legal.benefits.3"),
    ],
    complianceInfo: t("web.useCases.legal.compliance"),
    ctaText: t("web.useCases.legal.cta"),
    ctaLink: "/pricing",
  };
}
