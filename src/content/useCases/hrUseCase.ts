import { type UseCase } from "../../types/useCase";

export function getHRUseCase(t: Function): UseCase {
  return {
    id: "hr-manager",
    title: t("web.useCases.hr.title", "HR Manager"),
    icon: "user-group",
    description: t(
      "web.useCases.hr.description",
      "Securely share sensitive employee information and credentials",
    ),
    exampleSecret:
      "New hire portal: https://onboarding.example.com\nTemp access code: PU987654",
    benefits: [
      t(
        "web.useCases.hr.benefits.1",
        "Safely transmit onboarding credentials to new employees",
      ),
      t(
        "web.useCases.hr.benefits.2",
        "Share confidential information with one-time access",
      ),
      t(
        "web.useCases.hr.benefits.3",
        "Maintain privacy for sensitive HR communications",
      ),
    ],
    complianceInfo: t(
      "web.useCases.hr.compliance",
      "Helps meet GDPR and other privacy regulations for handling personal data",
    ),
    ctaText: t("web.useCases.hr.cta", "Secure HR Communications"),
    ctaLink: "/create",
  };
}
