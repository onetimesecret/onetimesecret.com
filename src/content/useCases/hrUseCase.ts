import { type UseCase } from "../../types/useCase";

export function getHRUseCase(t: Function): UseCase {
  return {
    id: "hr",
    title: t("web.useCases.hr.title"),
    icon: "users",
    description: t("web.useCases.hr.description"),
    exampleSecret: t("web.useCases.hr.exampleSecret"),
    benefits: [
      t("web.useCases.hr.benefits.1"),
      t("web.useCases.hr.benefits.2"),
      t("web.useCases.hr.benefits.3"),
    ],
    complianceInfo: t("web.useCases.hr.compliance"),
    ctaText: t("web.useCases.hr.cta"),
    ctaLink: "/create",
  };
}
