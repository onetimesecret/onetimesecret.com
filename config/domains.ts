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
 * Whether `hostname` is one of `domains` or a subdomain of one. `domains` are
 * the lookalike domains Onetime Secret owns: misspellings and alternate TLDs
 * of onetimesecret.com, each serving the notice site built by
 * astro.lookalike.config.ts. Same strict matching as isStagingHostname(): a
 * substring test would let `example-lookalike.tld.attacker.com` pass.
 *
 * The list itself is not kept in this repository, so the repository does not
 * advertise it. It is the `LOOKALIKE_DOMAINS` secret of the `lookalike` GitHub
 * environment (see lookalike/README.md). The notice pages do not need it: they
 * show `location.hostname` in the browser, so one build serves every domain.
 */
export function isLookalikeHostname(
  hostname: string,
  domains: readonly string[],
): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  return domains.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}
