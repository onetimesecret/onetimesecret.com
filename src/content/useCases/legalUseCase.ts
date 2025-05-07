import { type UseCase } from "../../types/useCase";

export function getLegalUseCase(t: Function): UseCase {
  return {
    id: "legal-team",
    title: t("web.useCases.legal.title", "Legal Team"),
    icon: "scale",
    description: t(
      "web.useCases.legal.description",
      "Share confidential legal documents and information securely",
    ),
    exampleSecret:
      "Case file access: https://legal.example.com/cases/2025-05-04\nAccess code: LGT-7721-CONF",
    benefits: [
      t(
        "web.useCases.legal.benefits.1",
        "Maintain attorney-client privilege in digital communications",
      ),
      t(
        "web.useCases.legal.benefits.2",
        "Securely share case-sensitive information with clients",
      ),
      t(
        "web.useCases.legal.benefits.3",
        "Control access to confidential settlement terms",
      ),
    ],
    complianceInfo: t(
      "web.useCases.legal.compliance",
      "Helps ensure confidentiality required by legal ethics rules and client confidentiality agreements",
    ),
    ctaText: t("web.useCases.legal.cta", "Secure Legal Communications"),
    ctaLink: "/create",
  };
}
