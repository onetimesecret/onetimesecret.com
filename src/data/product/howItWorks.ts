/**
 * Data constants for the HowItWorks component.
 *
 * Extracted into a shared module so both the Vue component and its
 * unit tests reference the same source of truth.
 */

/** Step identifiers used in v-for and i18n key interpolation */
export const STEPS = ["step1", "step2", "step3"] as const;

export type StepKey = (typeof STEPS)[number];

/** Zero-padded display numbers for the decorative step counter */
export const STEP_NUMBERS = ["01", "02", "03"] as const;
