/**
 * Changelog highlight icons and colours.
 *
 * Use exactly one of the 4 icons below per highlight item. Each icon has a
 * single canonical colour — don't introduce variants or re-colour them.
 *
 *   check → green   — something done, verified, shipped, or fixed
 *   info  → sky     — neutral supporting detail
 *   warn  → amber   — caution, constraint, or behaviour change
 *   ask   → violet  — open question or planned / pending work
 *
 * MDX frontmatter usage:
 *
 *   highlights:
 *     - icon: check
 *       text: "…"
 *     - icon: warn
 *       text: "…"
 */

export type HighlightIcon = "check" | "info" | "warn" | "ask";

export type HighlightItem = string | { icon: HighlightIcon; text: string };

export const colorByIcon: Record<HighlightIcon, string> = {
  check: "text-green-600 dark:text-green-400",
  info: "text-sky-600 dark:text-sky-400",
  warn: "text-amber-600 dark:text-amber-400",
  ask: "text-violet-600 dark:text-violet-400",
};
