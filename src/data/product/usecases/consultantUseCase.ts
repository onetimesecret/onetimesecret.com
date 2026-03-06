import { type UseCase } from "@/types/useCase";

export function getConsultantUseCase(t: (key: string) => string): UseCase {
  const exampleSecret = `Here's the temporary password for the client portal:
TmpAcc3ss!xQ9`;

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
