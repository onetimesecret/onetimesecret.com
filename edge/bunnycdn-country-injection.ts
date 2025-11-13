/**
 * BunnyCDN Edge Script - Country Code Injection
 *
 * This edge middleware injects the user's country code into the HTML response
 * before it reaches the client. This enables immediate geolocation-based
 * jurisdiction selection without additional network requests or CORS issues.
 *
 * Features:
 * - Injects country code from BunnyCDN request context into HTML
 * - Caches responses per country using Vary header
 * - Only processes HTML responses (skips CSS, JS, images, etc.)
 * - Falls back to 'US' if country code is unavailable
 *
 * Usage:
 * Deploy this script to your BunnyCDN pull zone's edge script settings.
 * The script will automatically inject window.__USER_COUNTRY__ into all HTML pages.
 *
 * Client-side usage:
 * const countryCode = (window as any).__USER_COUNTRY__;
 *
 * @see https://docs.bunny.net/docs/edge-script-documentation
 */

/**
 * BunnyCDN Edge Script Environment
 * Minimal type definition for edge script context
 */
interface EdgeScriptEnv {
  // Add environment variables here as needed
  [key: string]: unknown;
}

/**
 * BunnyCDN Edge Script Context
 * Minimal type definition for execution context
 */
interface EdgeScriptContext {
  // Add context properties here as needed
  [key: string]: unknown;
}

/**
 * Extended Request interface with Cloudflare properties
 */
interface BunnyCDNRequest extends Request {
  cf?: {
    country?: string;
  };
}

export default {
  /**
   * Fetch handler for BunnyCDN edge script
   * @param request - The incoming HTTP request
   * @param env - Environment variables (if configured)
   * @param ctx - Execution context
   * @returns Modified response with injected country code
   */
  async fetch(request: BunnyCDNRequest, env: EdgeScriptEnv, ctx: EdgeScriptContext): Promise<Response> {
    // Get the original response from origin
    const response = await fetch(request);

    // Only modify HTML responses - skip other content types
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return response;
    }

    // Get country code from BunnyCDN request context
    // Falls back to 'US' if not available
    const countryCode = request.cf?.country || 'US';

    // Read the HTML content
    const html = await response.text();

    // Create the injection script
    // Using a data attribute approach for better debuggability
    const injection = `<script data-user-country="${countryCode}">window.__USER_COUNTRY__='${countryCode}';</script>`;

    // Inject the script before closing </head> tag
    // This ensures it's available before any body scripts run
    let modified = html.replace(/<\/head>/i, `${injection}</head>`);

    // Fallback: if no </head> found, inject at start of <body>
    if (modified === html) {
      modified = html.replace(/<body([^>]*)>/i, `<body$1>${injection}`);
    }

    // Create new response with modified HTML
    const newResponse = new Response(modified, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });

    // IMPORTANT: Vary header tells BunnyCDN to cache separate versions per country
    // This means the edge script only runs once per country per page
    // Subsequent requests from the same country will use the cached version
    newResponse.headers.set('Vary', 'CF-IPCountry');

    return newResponse;
  },
};
