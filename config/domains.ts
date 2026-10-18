// config/domains.ts
// Central domain configuration for canonical URLs and environment detection

/**
 * The canonical production domain - always used for SEO tags
 * (canonical URL, og:url, hreflang links)
 */
export const CANONICAL_ORIGIN = 'https://onetimesecret.com';

/**
 * Hostnames that indicate a staging/development environment.
 * The banner will show on any hostname containing these substrings.
 */
export const STAGING_HOSTNAMES = [
  'onetimesecret.dev',  // Staging deployment
  'onetime.dev',        // Local development (web.onetime.dev)
] as const;

/**
 * Check if a hostname is a staging/development environment.
 * Uses strict matching (exact match or subdomain) to prevent spoofing
 * attacks where an attacker could create domains like onetimesecret.dev.attacker.com
 */
export function isStagingHostname(hostname: string): boolean {
  return STAGING_HOSTNAMES.some(staging =>
    hostname === staging || hostname.endsWith(`.${staging}`)
  );
}

/**
 * A lookalike domain Onetime Secret owns: a misspelling or alternate TLD of
 * onetimesecret.com. Each one serves the notice site built by
 * astro.lookalike.config.ts.
 *
 * This list is the inventory. The notice pages do not read it (they show
 * `location.hostname` in the browser, so one build serves every domain); it
 * exists so the CDN hostname set, the DNS probe and the DNS hardening
 * checklist in lookalike/README.md have one source of truth to reconcile
 * against. Add a domain here when it is acquired.
 */
export interface LookalikeDomain {
  /** Bare registrable hostname, lowercase, no scheme or path. */
  domain: string;
  /** Date Onetime Secret acquired the domain, YYYY-MM-DD. */
  acquired: string;
  /** Optional internal note. */
  note?: string;
}

export const LOOKALIKE_DOMAINS: readonly LookalikeDomain[] = [
  // { domain: "example-lookalike.tld", acquired: "2026-01-31", note: "..." },
];

/**
 * Whether `hostname` is one of the owned lookalike domains or a subdomain of
 * one. Same strict matching as isStagingHostname(): a substring test would let
 * `example-lookalike.tld.attacker.com` pass.
 */
export function isLookalikeHostname(
  hostname: string,
  domains: readonly LookalikeDomain[] = LOOKALIKE_DOMAINS,
): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  return domains.some(
    ({ domain }) => host === domain || host.endsWith(`.${domain}`),
  );
}
