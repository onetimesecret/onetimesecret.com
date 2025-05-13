import { type UseCase } from "../../types/useCase";

export function getDeveloperUseCase(t: (key: string) => string): UseCase {
  // Developer example secret
  const exampleSecret = `API_KEY_NAME=sk_test_abcd

API_SECRET=5Up0rS3kRu7`;

  return {
    id: "developer",
    title: t("web.useCases.developer.title"),
    icon: "code-bracket",
    description: t("web.useCases.developer.description"),
    exampleSecret: exampleSecret,
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
