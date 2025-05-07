import { type UseCase } from "../../types/useCase";

export function getITUseCase(t: Function): UseCase {
  return {
    id: "it",
    title: t("web.useCases.it.title"),
    icon: "shield-check",
    description: t("web.useCases.it.description"),
    exampleSecret: t("web.useCases.it.exampleSecret"),
    benefits: [
      t("web.useCases.it.benefits.1"),
      t("web.useCases.it.benefits.2"),
      t("web.useCases.it.benefits.3"),
    ],
    complianceInfo: t("web.useCases.it.compliance"),
    ctaText: t("web.useCases.it.cta"),
    ctaLink: "/create",
  };
}
