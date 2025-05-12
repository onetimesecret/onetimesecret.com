import { type UseCase } from "../../types/useCase";

export function getLegalUseCase(t: (key: string) => string): UseCase {
  // Legal team example secret
  const exampleSecret = `
Case File: Project Alpha vs. Spaghetti Corp
Access Code: Ragu22`;

  return {
    id: "legal",
    title: t("web.useCases.legal.title"),
    icon: "scale",
    description: t("web.useCases.legal.description"),
    exampleSecret: exampleSecret,
    benefits: [
      t("web.useCases.legal.benefits.1"),
      t("web.useCases.legal.benefits.2"),
      t("web.useCases.legal.benefits.3"),
    ],
    complianceInfo: t("web.useCases.legal.compliance"),
    ctaText: t("web.useCases.legal.cta"),
    ctaLink: "/create",
  };
}
