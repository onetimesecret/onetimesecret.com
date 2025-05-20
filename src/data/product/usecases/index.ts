import { type UseCase } from "@/types/useCase";
import { getDeveloperUseCase } from "./developerUseCase";
import { getHRUseCase } from "./hrUseCase";
import { getITUseCase } from "./itUseCase";
import { getLegalUseCase } from "./legalUseCase";

/**
 * Returns all use cases with translations applied
 * @param t Translation function from vue-i18n
 * @returns Array of use case objects with translation strings
 */
export function getUseCases(t: Function): UseCase[] {
  return [
    getITUseCase(t),
    getDeveloperUseCase(t),
    getHRUseCase(t),
    getLegalUseCase(t),
  ];
}
