// src/content/product/plans.ts

import type { PlanOptions } from "@/types/plan-options";

/**
 * Represents a subscription plan with its associated properties and capabilities.
 */
export class Plan {
  // A static map to store all plan instances, keyed by their normalized plan ID.
  private static plans: Map<string, Plan> = new Map();

  public readonly planid: string;
  public readonly price: number;
  public readonly discount: number;
  public readonly options: PlanOptions;

  /**
   * Creates an instance of a Plan.
   * @param planid - The unique identifier for the plan.
   * @param price - The base price of the plan.
   * @param discount - The discount percentage (e.g., 0.1 for 10%).
   * @param options - Additional options and features for the plan.
   */
  constructor(
    planid: string,
    price: number,
    discount: number,
    options: PlanOptions,
  ) {
    this.planid = Plan.normalize(planid);
    this.price = price;
    this.discount = discount;
    this.options = options;
  }

  /**
   * Calculates the effective price of the plan after applying the discount.
   * @returns The calculated price as an integer.
   */
  public get calculatedPrice(): number {
    return Math.floor(this.price * (1 - this.discount));
  }

  /**
   * Checks if the plan has a cost (i.e., is not free).
   * @returns True if the plan is a paid plan, false otherwise.
   */
  public get isPaid(): boolean {
    return !this.isFree;
  }

  /**
   * Checks if the plan is free.
   * @returns True if the calculated price is zero, false otherwise.
   */
  public get isFree(): boolean {
    return this.calculatedPrice === 0;
  }

  /**
   * Normalizes a plan ID to a consistent string format (lowercase).
   * @param planid - The plan ID to normalize.
   * @returns The normalized plan ID.
   */
  public static normalize(planid: string | number): string {
    return String(planid).toLowerCase();
  }

  /**
   * Adds a new plan to the central repository of plans.
   * If a plan with the same normalized ID already exists, it will be overwritten.
   * @param planid - The unique identifier for the plan.
   * @param price - The base price of the plan.
   * @param discount - The discount percentage.
   * @param options - Additional options for the plan.
   * @returns The newly created and added Plan instance.
   */
  public static addPlan(
    planid: string,
    price: number,
    discount: number,
    options: PlanOptions,
  ): Plan {
    const newPlan = new Plan(planid, price, discount, options);
    this.plans.set(newPlan.planid, newPlan);
    // The Ruby version also adds a short gibbler hash.
    // If you need a similar short ID, you'd implement that logic here.
    // For now, we'll just use the normalized planid.
    return newPlan;
  }

  /**
   * Retrieves a plan by its ID.
   * @param planid - The ID of the plan to retrieve.
   * @returns The Plan instance if found, otherwise undefined.
   */
  public static getPlan(planid: string | number): Plan | undefined {
    return this.plans.get(this.normalize(planid));
  }

  /**
   * Checks if a plan with the given ID exists.
   * @param planid - The ID of the plan to check.
   * @returns True if the plan exists, false otherwise.
   */
  public static hasPlan(planid: string | number): boolean {
    return this.plans.has(this.normalize(planid));
  }

  /**
   * Loads the predefined set of plans into the system.
   * This method should be called once during application initialization.
   */
  public static loadPlans(): void {
    this.addPlan("anonymous", 0, 0, {
      ttl: 7 * 24 * 60 * 60, // 7 days in seconds
      size: 100_000,
      api: false,
      name: "Anonymous",
    });
    this.addPlan("basic", 0, 0, {
      ttl: 14 * 24 * 60 * 60, // 14 days in seconds
      size: 1_000_000,
      api: true,
      name: "Basic Plan",
      email: true,
      custom_domains: false,
      dark_mode: true,
    });
    this.addPlan("identity", 35, 0, {
      ttl: 30 * 24 * 60 * 60, // 30 days in seconds
      size: 10_000_000,
      api: true,
      name: "Identity",
      email: true,
      custom_domains: true,
      dark_mode: true,
    });
  }

  /**
   * Retrieves all loaded plans.
   * @returns A map of all plans, keyed by their normalized plan ID.
   */
  public static getAllPlans(): Map<string, Plan> {
    return this.plans;
  }
}

// Example of loading plans (typically done at application startup)
// Plan.loadPlans();

// Example usage:
// const basicPlan = Plan.getPlan('basic');
// if (basicPlan) {
//   console.log(basicPlan.name); // 'Basic Plan'
//   console.log(basicPlan.calculatedPrice); // 0
//   console.log(basicPlan.options.ttl); // 1209600 (14 days in seconds)
// }
