import { type UseCase } from "@/types/useCase";

export function getITUseCase(t: (key: string) => string): UseCase {
  // IT professional example secret
  const exampleSecret = `prod_api_token_51H7xYz9A2bC3dE4fG`;

  return {
    id: "it",
    title: t("web.useCases.it.title"),
    icon: "shield-check",
    description: t("web.useCases.it.description"),
    exampleSecret: exampleSecret,
    benefits: [
      t("web.useCases.it.benefits.1"),
      t("web.useCases.it.benefits.2"),
      t("web.useCases.it.benefits.3"),
    ],
    complianceInfo: t("web.useCases.it.compliance"),
    ctaText: t("web.useCases.it.cta"),
    ctaLink: "/signup",
  };
}
