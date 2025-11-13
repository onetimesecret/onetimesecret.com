/**
 * BunnyCDN Edge Script - Country Code Injection
 *
 * This edge middleware injects the user's country code into the HTML response
 * before it reaches the client. This enables immediate geolocation-based
 * jurisdiction selection without additional network requests or CORS issues.
 *
 * How it works:
 * 1. BunnyCDN edge rule sets the O-Country-Code response header based on user's IP
 * 2. This script reads the O-Country-Code header from the response
 * 3. Injects the country code into HTML as window.__USER_COUNTRY__
 * 4. Client-side code can immediately access the country code
 *
 * Features:
 * - Reads country code from O-Country-Code response header (set by edge rule)
 * - Uses streaming for memory-efficient HTML transformation
 * - Caches responses per country using Vary header
 * - Only processes HTML responses (skips CSS, JS, images, etc.)
 * - Falls back to 'US' if country code is unavailable
 *
 * Prerequisites:
 * - BunnyCDN edge rule must be configured to set O-Country-Code header
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

import * as BunnySDK from "https://esm.sh/@bunny.net/edgescript-sdk@0.11.2";

/**
 * Modifies the origin response to inject country code into HTML
 *
 * This runs after the response comes from origin but before it's cached.
 *
 * @param context - The edge script context
 * @param context.request - The incoming HTTP request
 * @param context.response - The response from origin
 * @returns Modified response with injected country code
 */
async function onOriginResponse(context: {
  request: Request;
  response: Response;
}): Promise<Response | void> {
  try {
    const { request, response } = context;
    const isDebug = request.url.includes(".dev"); // Enable debug on staging

    // Only modify HTML responses - skip other content types
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return; // Return void to use original response
    }

    if (isDebug) {
      console.log("[Edge Script] Processing HTML response for:", request.url);
      console.log("[Edge Script] Available headers:", Array.from(response.headers.entries()));
    }

    // Get country code from BunnyCDN edge rule response header
    // Try multiple possible header names
    let countryCode =
      response.headers.get("O-Country-Code") ||
      response.headers.get("o-country-code") ||
      response.headers.get("O-User-Country") ||
      response.headers.get("o-user-country") ||
      "US";

    if (isDebug) {
      console.log("[Edge Script] Country code from headers:", countryCode);
    }

    // Validate country code format (ISO 3166-1 alpha-2)
    // Must be exactly 2 uppercase letters
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      if (isDebug) {
        console.warn(
          `[Edge Script] Invalid country code: ${countryCode}, falling back to US`
        );
      }
      countryCode = "US";
    }

    // Sanitize country code for safe HTML injection
    // Escape any potential XSS characters (defense in depth)
    const sanitizedCode = countryCode.replace(/['"<>&]/g, "");

    if (isDebug) {
      console.log("[Edge Script] Sanitized country code:", sanitizedCode);
    }

    // Create the injection script with debug logging
    const debugScript = isDebug
      ? `console.log('[Edge Script] Injected country code:', '${sanitizedCode}');`
      : "";
    const injection = `<script data-user-country="${sanitizedCode}">window.__USER_COUNTRY__='${sanitizedCode}';${debugScript}</script>`;

    // Use streaming to transform HTML for better memory efficiency
    // This avoids buffering the entire response in memory
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let buffer = "";
    let injected = false;

    // Process the response stream
    const reader = response.body?.getReader();
    if (!reader) {
      console.error("Response body is null");
      return; // Return void to use original response
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
              buffer = buffer.replace(
                /<body([^>]*)>/i,
                `<body$1>${injection}`
              );
              if (isDebug) {
                console.log("[Edge Script] Injected at <body> (fallback)");
              }
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
          if (!injected && buffer.includes("</head>")) {
            buffer = buffer.replace(/<\/head>/i, `${injection}</head>`);
            injected = true;
            if (isDebug) {
              console.log("[Edge Script] Injected before </head>");
            }
          }

          // Write complete buffer if we've injected or buffer is large enough
          // Keep last 10 chars to handle tags split across chunks
          if (injected || buffer.length > 1024) {
            const writeContent = injected ? buffer : buffer.slice(0, -10);
            if (writeContent) {
              await writer.write(encoder.encode(writeContent));
              buffer = injected ? "" : buffer.slice(-10);
            }
          }
        }
      } catch (streamError) {
        console.error("[Edge Script] Stream processing error:", streamError);
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
    newResponse.headers.set("Vary", "O-Country-Code");

    if (isDebug) {
      console.log(
        "[Edge Script] Returning modified response with Vary header"
      );
    }

    return newResponse;
  } catch (error) {
    // Log error but don't break the site - return void to use original response
    console.error("[Edge Script] Error:", error);
    return; // Return void to use original response
  }
}

// Register the edge script handlers
BunnySDK.net.http.servePullZone().onOriginResponse(onOriginResponse);
