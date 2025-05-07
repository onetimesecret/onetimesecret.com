import { type UseCase } from "../../types/useCase";

export function getDeveloperUseCase(t: (key: string) => string): UseCase {
  return {
    id: "developer",
    title: t("web.useCases.developer.title"),
    icon: "code-bracket",
    description: t("web.useCases.developer.description"),
    exampleSecret: t("web.useCases.developer.exampleSecret"),
    benefits: [
      t("web.useCases.developer.benefits.1"),
      t("web.useCases.developer.benefits.2"),
      t("web.useCases.developer.benefits.3"),
    ],
    complianceInfo: t("web.useCases.developer.compliance"),
    ctaText: t("web.useCases.developer.cta"),
    ctaLink: "/create",
  };
}
