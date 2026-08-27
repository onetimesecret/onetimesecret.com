/**
 * @file bunnyEdgeSdkStub.ts
 * @description Stands in for `npm:@bunny.net/edgescript-sdk@0.12.1` so the
 * country-injection edge script can be imported by vitest.
 *
 * Two reasons the real package cannot be used: the `npm:` specifier is Deno
 * syntax that vite's import analysis rejects at transform time (before
 * `vi.mock` ever runs), and the SDK itself only exists inside Bunny's runtime.
 * `test/unit/vitest.config.ts` aliases the specifier to this file.
 *
 * The edge script registers itself by calling
 * `servePullZone().onOriginResponse(cb)` at module scope and exports nothing,
 * so capturing that callback here is the only handle a test has on it.
 */

/** Context Bunny hands the origin-response middleware. */
export interface OriginResponseContext {
  request: Request;
  response: Response;
}

export type OriginResponseHandler = (
  context: OriginResponseContext
) => Response | void | Promise<Response | void>;

export type OriginRequestHandler = (context: { request: Request }) => unknown;

/** Every callback registered since the module was first evaluated. */
export const originResponseHandlers: OriginResponseHandler[] = [];
export const originRequestHandlers: OriginRequestHandler[] = [];

/** How many times a script asked for a pull-zone server. */
export const servePullZoneCalls = { count: 0 };

const server = {
  onOriginRequest(handler: OriginRequestHandler) {
    originRequestHandlers.push(handler);
    return server;
  },
  onOriginResponse(handler: OriginResponseHandler) {
    originResponseHandlers.push(handler);
    return server;
  },
};

export const net = {
  http: {
    servePullZone() {
      servePullZoneCalls.count += 1;
      return server;
    },
  },
};
