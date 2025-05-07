import { type UseCase } from "../../types/useCase";

export function getDeveloperUseCase(t: Function): UseCase {
  return {
    id: "developer",
    title: t("web.useCases.developer.title", "Developer"),
    icon: "code-bracket",
    description: t(
      "web.useCases.developer.description",
      "Share API keys and credentials securely during development",
    ),
    exampleSecret: "API_KEY=sk_test_EXAMPLE_KEY\nAPI_SECRET=5Up0rS3kRu7",
    benefits: [
      t(
        "web.useCases.developer.benefits.1",
        "Keep API keys and tokens out of code repositories",
      ),
      t(
        "web.useCases.developer.benefits.2",
        "Securely onboard new team members with access credentials",
      ),
      t(
        "web.useCases.developer.benefits.3",
        "Share database connection strings without compromising security",
      ),
    ],
    complianceInfo: t(
      "web.useCases.developer.compliance",
      "Helps enforce security best practices for CI/CD pipelines and infrastructure access",
    ),
    ctaText: t("web.useCases.developer.cta", "Secure Your API Keys"),
    ctaLink: "/create",
  };
}
