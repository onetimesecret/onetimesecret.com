import { type UseCase } from "@/types/useCase";

export function getHealthcareUseCase(t: (key: string) => string): UseCase {
  return {
    id: "healthcare",
    title: t("web.useCases.healthcare.title"),
    icon: "🏥",
    description: t("web.useCases.healthcare.description"),
    exampleSecret: "",
    benefits: [],
    complianceInfo: "",
    ctaText: "",
    ctaLink: "/signup",
  };
}
