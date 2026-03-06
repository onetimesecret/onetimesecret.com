import { type UseCase } from "@/types/useCase";

export function getConsultantUseCase(t: (key: string) => string): UseCase {
  const exampleSecret = `Client Portal: https://app.example.com
Login: contractor-2026
Pass: TmpAcc3ss!xQ9`;

  return {
    id: "consultants",
    title: t("web.useCases.consultants.title"),
    icon: "\uD83D\uDCBC",
    description: t("web.useCases.consultants.description"),
    exampleSecret,
    benefits: [],
    complianceInfo: "",
    ctaText: "",
    ctaLink: "/signup",
  };
}
