import { type UseCase } from "@/types/useCase";
import { getConsultantUseCase } from "./consultantUseCase";
import { getHRUseCase } from "./hrUseCase";
import { getITDevOpsUseCase } from "./itdevopsUseCase";
import { getLegalUseCase } from "./legalUseCase";

/**
 * Returns all use cases with translations applied
 * @param t Translation function from vue-i18n
 * @returns Array of use case objects with translation strings
 */
export function getUseCases(t: (key: string) => string): UseCase[] {
  return [
    getITDevOpsUseCase(t),
    getHRUseCase(t),
    getLegalUseCase(t),
    getConsultantUseCase(t),
  ];
}
