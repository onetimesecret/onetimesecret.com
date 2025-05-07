import { type UseCase } from "../../types/useCase";

export function getITUseCase(t: Function): UseCase {
  return {
    id: "it-professional",
    title: t("web.useCases.it.title", "IT Professional"),
    icon: "computer-desktop",
    description: t(
      "web.useCases.it.description",
      "Securely share credentials and access information with your team",
    ),
    exampleSecret: "Username: oracle\nPassword: tiger",
    benefits: [
      t(
        "web.useCases.it.benefits.1",
        "Prevent credential leaks in email and chat logs",
      ),
      t("web.useCases.it.benefits.2", "Audit when secrets are accessed"),
      t(
        "web.useCases.it.benefits.3",
        "Enforce security protocols for sensitive information",
      ),
    ],
    complianceInfo: t(
      "web.useCases.it.compliance",
      "Helps meet SOC 2 and ISO 27001 security requirements for access control",
    ),
    ctaText: t("web.useCases.it.cta", "Secure Your Credentials"),
    ctaLink: "/create",
  };
}
