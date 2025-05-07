import { type UseCase } from "../../types/useCase";

export function getLegalUseCase(t: Function): UseCase {
  return {
    id: "legal",
    title: t("web.useCases.legal.title"),
    icon: "scale", // This can remain if it's a non-translatable identifier for an icon
    description: t("web.useCases.legal.description"),
    exampleSecret: t("web.useCases.legal.exampleSecret"),
    benefits: [
      t("web.useCases.legal.benefits.1"),
      t("web.useCases.legal.benefits.2"),
      t("web.useCases.legal.benefits.3"),
    ],
    complianceInfo: t("web.useCases.legal.compliance"),
    ctaText: t("web.useCases.legal.cta"),
    ctaLink: "/create", // This can remain if it's a non-translatable path
  };
}
