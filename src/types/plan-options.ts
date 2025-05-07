// src/types/plan-options.ts

/**
 * Defines the structure for options associated with a plan.
 */
export interface PlanOptions {
  ttl: number; // Time to live for secrets, e.g., in seconds or days
  size: number; // Maximum secret size, e.g., in bytes
  api: boolean; // Whether API access is enabled
  name: string; // Display name of the plan
  email?: boolean; // Whether email features are included
  custom_domains?: boolean; // Whether custom domains are supported
  dark_mode?: boolean; // Whether dark mode is available
}
