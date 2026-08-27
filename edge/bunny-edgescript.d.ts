/**
 * Ambient declarations for the BunnyCDN Edge Scripting runtime (Deno).
 *
 * These types exist for editor support only. `edge/**` is not part of
 * `tsconfig.json`'s `include`, and the deployed script resolves the real
 * `npm:` specifier in Deno, so nothing here reaches production.
 */

/** Minimal subset of the HTMLRewriter API used by the injection script. */
declare class HTMLRewriter {
  on(
    selector: string,
    handlers: {
      element?(element: {
        append(content: string, options?: { html?: boolean }): void;
      }): void;
    },
  ): HTMLRewriter;
  transform(response: Response): Response;
}

declare module "npm:@bunny.net/edgescript-sdk@0.12.1" {
  /** Context handed to the origin-response middleware. */
  export interface OriginResponseContext {
    request: Request;
    response: Response;
  }

  export interface PullZoneServer {
    onOriginRequest(
      handler: (context: { request: Request }) => unknown,
    ): PullZoneServer;
    onOriginResponse(
      handler: (
        context: OriginResponseContext,
      ) => Response | void | Promise<Response | void>,
    ): PullZoneServer;
  }

  export const net: {
    http: {
      servePullZone(): PullZoneServer;
    };
  };
}
