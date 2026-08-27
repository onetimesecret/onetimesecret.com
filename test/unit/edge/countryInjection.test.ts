// The edge scripts are type-checked by tsconfig.edge.json, which picks up
// bunny-edgescript.d.ts through its `edge/**` include. Importing one from here
// pulls it into the *root* program instead, where that declaration file is out
// of scope — without this reference, `npm:@bunny.net/…` and `HTMLRewriter`
// have no types and `pnpm type-check` fails. An import cannot replace it: the
// declarations are ambient, and .d.ts paths are not importable.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../edge/bunny-edgescript.d.ts" />

/**
 * @file countryInjection.test.ts
 * @description Unit tests for the BunnyCDN country-injection edge script entry
 * point (edge/bunnycdn-country-injection.ts).
 *
 * The script exports nothing: it registers an origin-response callback at
 * module scope and everything it does happens inside that callback. So the
 * things worth pinning here are the ones no other suite can see — that the
 * registration happens at all, that assets are left alone, that a missing
 * country signal injects *nothing* rather than a fabricated default, and that
 * a real country gets exactly `buildCountryScriptTag`'s output appended to
 * <head>. The country → tag mapping itself is covered by
 * test/unit/utils/edgeCountry.test.ts.
 *
 * Two pieces of the Bunny runtime are faked: the SDK, via the alias in
 * test/unit/vitest.config.ts (see test/unit/helpers/bunnyEdgeSdkStub.ts), and
 * `HTMLRewriter`, below.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../../../edge/bunnycdn-country-injection';
import { COUNTRY_HEADER, buildCountryScriptTag } from '../../../edge/country';
import {
  originResponseHandlers,
  servePullZoneCalls,
} from '../helpers/bunnyEdgeSdkStub';

/** What the fake HTMLRewriter hands back, so a transform is identifiable. */
const TRANSFORMED = new Response('transformed');

interface Appended {
  selector: string;
  content: string;
  html?: boolean;
}

let appended: Appended[] = [];
let transformed: Response | null = null;

/**
 * Enough of HTMLRewriter to observe the injection. The real one calls the
 * element handler while streaming the body; calling it from `on()` is the
 * simplification, and it is safe because the handler only ever appends.
 */
class FakeHTMLRewriter {
  on(
    selector: string,
    handlers: {
      element?(element: {
        append(content: string, options?: { html?: boolean }): void;
      }): void;
    }
  ): FakeHTMLRewriter {
    handlers.element?.({
      append: (content, options) => {
        appended.push({ selector, content, html: options?.html });
      },
    });
    return this;
  }

  transform(response: Response): Response {
    transformed = response;
    return TRANSFORMED;
  }
}

const globalScope = globalThis as unknown as { HTMLRewriter?: unknown };

/** Builds an origin response the way Bunny would hand one to the callback. */
function originResponse(contentType: string | null): Response {
  const headers = contentType ? { 'content-type': contentType } : undefined;
  return new Response('<html><head></head></html>', { headers });
}

/** Runs the registered callback against one origin response. */
async function inject(
  contentType: string | null,
  country?: string
): Promise<Response | void> {
  const headers = country ? { [COUNTRY_HEADER]: country } : undefined;
  return originResponseHandlers[0]({
    request: new Request('https://onetimesecret.com/', { headers }),
    response: originResponse(contentType),
  });
}

beforeEach(() => {
  appended = [];
  transformed = null;
  globalScope.HTMLRewriter = FakeHTMLRewriter;
});

afterEach(() => {
  delete globalScope.HTMLRewriter;
});

describe('registration', () => {
  it('registers one origin-response callback at module scope', () => {
    // The import above is a bare side-effect import; this is the only proof
    // that importing the script is enough to install it on the pull zone.
    expect(servePullZoneCalls.count).toBe(1);
    expect(originResponseHandlers).toHaveLength(1);
  });
});

describe('non-HTML responses', () => {
  it.each(['image/png', 'application/json', 'text/css', null])(
    'passes %s through untransformed',
    async (contentType) => {
      const result = await inject(contentType, 'GB');

      expect(result).toBeUndefined();
      expect(appended).toHaveLength(0);
      expect(transformed).toBeNull();
    }
  );
});

describe('no usable country signal', () => {
  it.each([
    undefined,
    '',
    // Legacy GeoIP continent codes and malformed values are not countries.
    'EU',
    'AP',
    'USA',
    'U',
  ])('injects nothing for %s', async (country) => {
    const result = await inject('text/html', country);

    expect(result).toBeUndefined();
    expect(appended).toHaveLength(0);
    expect(transformed).toBeNull();
  });
});

describe('injection', () => {
  it.each(['text/html', 'text/html; charset=utf-8'])(
    'appends the country script tag to head for %s',
    async (contentType) => {
      const result = await inject(contentType, 'GB');

      expect(result).toBe(TRANSFORMED);
      expect(appended).toHaveLength(1);
      expect(appended[0].selector).toBe('head');
      expect(appended[0].content).toBe(buildCountryScriptTag('GB'));
      // Without html:true the tag would be escaped into visible text.
      expect(appended[0].html).toBe(true);
    }
  );

  it('normalizes the country code before building the tag', async () => {
    await inject('text/html', '  gb  ');

    expect(appended[0].content).toBe(buildCountryScriptTag('GB'));
  });

  it('transforms the origin response rather than a new one', async () => {
    // Bunny caches whatever comes back; it has to be the origin body.
    const result = await inject('text/html', 'US');

    expect(result).toBe(TRANSFORMED);
    expect(transformed).toBeDefined();
    expect(await (transformed as unknown as Response).text()).toBe(
      '<html><head></head></html>'
    );
  });
});
