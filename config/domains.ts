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
