/**
 * Generates the `connect-src` directive for the Content Security Policy.
 * This directive specifies which origins the browser is allowed to connect to.
 *
 * @param apiUrl - The base URL of the API. Can be undefined if not set.
 * @param isDebugMode - Boolean indicating if the application is in development/debug mode.
 * @returns A string representing the `connect-src` directive values.
 */
export function generateCspConnectSrc(
  apiUrl?: string,
  isDebugMode?: boolean,
): string {
  const directives = [
    "'self'", // Allows connections to the same origin
    apiUrl, // Allows connections to the configured API URL
    "https://catch.onetimesecret.com", // Sentry endpoint for error reporting
    "https://eu.onetimesecret.com", // Regional endpoint
    "https://ca.onetimesecret.com", // Regional endpoint
    "https://nz.onetimesecret.com", // Regional endpoint
    "https://us.onetimesecret.com", // Regional endpoint
  ];

  // In debug mode, allow connection to the Sentry debugging sidecar.
  // This aids local error tracking and debugging.
  if (isDebugMode) {
    directives.push("http://localhost:8969");
    directives.push("https://localhost:8969");
    directives.push("ws://localhost:8969");
    directives.push("wss://localhost:8969");
    directives.push("wss://localhost:4321");
    directives.push("ws://localhost:4321");
    directives.push("wss://web.onetime.dev");
  }

  // Filter out any null or undefined values (e.g., if apiUrl is not set)
  // and join the remaining directives into a space-separated string.
  return directives.filter(Boolean).join(" ");
}
