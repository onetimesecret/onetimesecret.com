import { type UseCase } from "../../types/useCase";

export function getHRUseCase(t: (key: string) => string): UseCase {
  // HR manager example secret
  const exampleSecret = `Temporary Password: Welc0me!2025

Access Link:
You can find the address in the handbook.`;

  return {
    id: "hr",
    title: t("web.useCases.hr.title"),
    icon: "users",
    description: t("web.useCases.hr.description"),
    exampleSecret: exampleSecret,
    benefits: [
      t("web.useCases.hr.benefits.1"),
      t("web.useCases.hr.benefits.2"),
      t("web.useCases.hr.benefits.3"),
    ],
    complianceInfo: t("web.useCases.hr.compliance"),
    ctaText: t("web.useCases.hr.cta"),
    ctaLink: "/pricing",
  };
}
