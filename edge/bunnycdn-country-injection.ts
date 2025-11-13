/**
 * BunnyCDN Edge Script - Country Code Injection
 *
 * This edge middleware injects the user's country code into the HTML response
 * before it reaches the client. This enables immediate geolocation-based
 * jurisdiction selection without additional network requests or CORS issues.
 *
 * Features:
 * - Injects country code from BunnyCDN request context into HTML
 * - Uses streaming for memory-efficient HTML transformation
 * - Caches responses per country using Vary header
 * - Only processes HTML responses (skips CSS, JS, images, etc.)
 * - Falls back to 'US' if country code is unavailable
 *
 * Usage:
 * Deploy this script to your BunnyCDN pull zone's edge script settings.
 * The script will automatically inject window.__USER_COUNTRY__ into all HTML pages.
 *
 * Client-side usage:
 * const countryCode = window.__USER_COUNTRY__;
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
 * Extended Request interface with BunnyCDN edge script properties
 * BunnyCDN provides request.cf.country for accessing the user's country code
 * @see https://docs.bunny.net/docs/edge-script-request-object
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
    try {
      // Get the original response from origin
      const response = await fetch(request);

      // Only modify HTML responses - skip other content types
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        return response;
      }

      // Get country code from BunnyCDN request context
      // Falls back to 'US' if not available
      let countryCode = request.cf?.country || 'US';

      // Validate country code format (ISO 3166-1 alpha-2)
      // Must be exactly 2 uppercase letters
      if (!/^[A-Z]{2}$/.test(countryCode)) {
        console.warn(`Invalid country code detected: ${countryCode}, falling back to US`);
        countryCode = 'US';
      }

      // Sanitize country code for safe HTML injection
      // Escape any potential XSS characters (defense in depth)
      const sanitizedCode = countryCode.replace(/['"<>&]/g, '');

      // Create the injection script
      const injection = `<script data-user-country="${sanitizedCode}">window.__USER_COUNTRY__='${sanitizedCode}';</script>`;

      // Use streaming to transform HTML for better memory efficiency
      // This avoids buffering the entire response in memory
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      let buffer = '';
      let injected = false;

      // Process the response stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is null');
      }

      // Stream processing in background
      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // Flush remaining buffer
              if (buffer && !injected) {
                // Fallback: inject at start of <body> if no </head> found
                buffer = buffer.replace(/<body([^>]*)>/i, `<body$1>${injection}`);
              }
              if (buffer) {
                await writer.write(encoder.encode(buffer));
              }
              await writer.close();
              break;
            }

            // Decode chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Try to inject before </head>
            if (!injected && buffer.includes('</head>')) {
              buffer = buffer.replace(/<\/head>/i, `${injection}</head>`);
              injected = true;
            }

            // Write complete buffer if we've injected or buffer is large enough
            // Keep last 10 chars to handle tags split across chunks
            if (injected || buffer.length > 1024) {
              const writeContent = injected ? buffer : buffer.slice(0, -10);
              if (writeContent) {
                await writer.write(encoder.encode(writeContent));
                buffer = injected ? '' : buffer.slice(-10);
              }
            }
          }
        } catch (streamError) {
          console.error('Stream processing error:', streamError);
          await writer.abort(streamError);
        }
      })();

      // Create new response with streaming body
      const newResponse = new Response(readable, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
      });

      // IMPORTANT: Vary header tells BunnyCDN to cache separate versions per country
      // This means the edge script only runs once per country per page
      // Subsequent requests from the same country will use the cached version
      newResponse.headers.set('Vary', 'CF-IPCountry');

      return newResponse;
    } catch (error) {
      // Log error but don't break the site - return original response
      console.error('Edge script error:', error);

      // Attempt to return original response if available
      try {
        return await fetch(request);
      } catch (fallbackError) {
        // Last resort: return a basic error response
        return new Response('Service temporarily unavailable', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    }
  },
};
