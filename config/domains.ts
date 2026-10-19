// config/domains.ts
// Central domain configuration for canonical URLs and environment detection

/**
 * The canonical production domain - always used for SEO tags
 * (canonical URL, og:url, hreflang links)
 */
export const CANONICAL_ORIGIN = "https://onetimesecret.com";

/**
 * Hostnames that indicate a staging/development environment.
 * The banner will show on any hostname containing these substrings.
 */
export const STAGING_HOSTNAMES = [
  "onetimesecret.dev", // Staging deployment
  "onetime.dev", // Local development (web.onetime.dev)
] as const;

/**
 * Check if a hostname is a staging/development environment.
 * Uses strict matching (exact match or subdomain) to prevent spoofing
 * attacks where an attacker could create domains like onetimesecret.dev.attacker.com
 */
export function isStagingHostname(hostname: string): boolean {
  return STAGING_HOSTNAMES.some(
    (staging) => hostname === staging || hostname.endsWith(`.${staging}`),
  );
}

/**
 * A lookalike domain Onetime Secret owns: a misspelling or alternate TLD of
 * onetimesecret.com. Each one serves the notice site built by
 * astro.lookalike.config.ts.
 *
 * LOOKALIKE_DOMAINS lists only the obvious ones. The rest are kept out of this
 * public repository, so it does not advertise them, in the `LOOKALIKE_DOMAINS`
 * secret of the `lookalike` GitHub environment (see lookalike/README.md). The
 * two together are the inventory the CDN hostname set, the DNS probe and the
 * DNS hardening checklist reconcile against. The notice pages read neither:
 * they show `location.hostname` in the browser, so one build serves every
 * domain.
 */
export interface LookalikeDomain {
  /** Bare registrable hostname, lowercase, no scheme or path. */
  domain: string;
  /**
   * Registry creation date, YYYY-MM-DD. For a domain bought from a previous
   * holder this predates Onetime Secret's ownership.
   */
  registered: string;
  /** Optional internal note. */
  note?: string;
}

export const LOOKALIKE_DOMAINS: readonly LookalikeDomain[] = [
  // `registered` from WHOIS on 2026-10-18.
  { domain: "onetimesecret.co", registered: "2025-12-26" },
  { domain: "onetimesecret.io", registered: "2025-12-26" },
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
