import { type UseCase } from "@/types/useCase";

export function getITDevOpsUseCase(t: (key: string) => string): UseCase {
  const exampleSecret = `prod_api_token_51H7xYz9A2bC3dE4fG`;

  return {
    id: "itdevops",
    title: t("web.useCases.itdevops.title"),
    icon: "🛡️",
    description: t("web.useCases.itdevops.description"),
    exampleSecret,
    benefits: [],
    complianceInfo: "",
    ctaText: "",
    ctaLink: "/signup",
  };
}
