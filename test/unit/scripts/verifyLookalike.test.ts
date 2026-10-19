/**
 * @file verifyLookalike.test.ts
 * @description Unit tests for checkPage in scripts/verify-lookalike.mjs, the
 * per-page half of the gate between `pnpm build:lookalike` and the upload of
 * the notice site. Fixture pages and messages only: nothing reads
 * dist-lookalike/ or the locale files, so a translation change cannot move
 * these tests.
 *
 * One valid page passes. Every other case breaks it in one way and asserts
 * the failure text, so each test proves the gate fails for the stated reason
 * and not for an incidental one. The anchor cases also pin what the DOM parse
 * fixed: `<a>` markup in a comment or a script string is not a link.
 *
 * @vitest-environment node
 */

import { describe, expect, it } from "vitest";
import {
  CANONICAL_HOSTNAME,
  checkPage,
} from "../../../scripts/verify-lookalike.mjs";

const PAGE = "en/index.html";

const MESSAGES = {
  languages: "Language",
  recipient: {
    heading: "Did a link send you here?",
    body: "Ask the sender to confirm the link.",
  },
  sender: { heading: "Want to create a secret?" },
  exposed: {
    heading: "Already shared sensitive information?",
    body: "Treat it as exposed.",
  },
  recognise: { heading: "What is this page?" },
};

const EXPECTED_HEADINGS = [
  MESSAGES.recipient.heading,
  MESSAGES.sender.heading,
  MESSAGES.exposed.heading,
  MESSAGES.recognise.heading,
];

const CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "connect-src 'none'",
  "form-action 'none'",
].join("; ");

const HEADER = `
  <header>
    <nav aria-label="Language">
      <a href="/fr/" hreflang="fr">Français</a>
      <a href="/de/" hreflang="de">Deutsch</a>
    </nav>
  </header>`;

const RECIPIENT = `
  <section>
    <h2>Did a link send you here?</h2>
    <p>Ask the sender to confirm the link.</p>
  </section>`;

// The address is split into styled parts the way Notice.astro renders it.
const SENDER = `
  <section>
    <h2>Want to create a secret?</h2>
    <p data-official-address dir="ltr">
      <span>onetime</span><span>secret.com</span>
    </p>
  </section>`;

const EXPOSED = `
  <section>
    <h2>Already shared sensitive information?</h2>
    <p>Treat it as exposed.</p>
    <details>
      <summary>What to do next</summary>
      <p>Change the password.</p>
    </details>
  </section>`;

const RECOGNISE = `
  <section>
    <h2>What is this page?</h2>
    <details data-lookalike-diff hidden>
      <summary>Compare this domain with the real one</summary>
    </details>
  </section>`;

function main(sections = [RECIPIENT, SENDER, EXPOSED, RECOGNISE]) {
  return `
  <main id="main-content">
    <article>
      <p>You are visiting <strong data-lookalike-hostname>this address</strong>.</p>
      ${sections.join("")}
    </article>
  </main>`;
}

const MODULE = `
  <script type="module">
    document.querySelector("[data-lookalike-diff]").hidden = false;
  </script>`;

function page(body = [HEADER, main(), MODULE]) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta name="robots" content="noindex, nofollow">
    <meta http-equiv="Content-Security-Policy" content="${CSP}">
    <title>This is not onetimesecret.com</title>
  </head>
  <body>${body.join("")}
  </body>
</html>`;
}

const VALID = page();

/** `html` with `from` replaced; throws if `from` is absent, so no case is vacuous. */
function variant(html: string, from: string, to: string): string {
  if (!html.includes(from)) throw new Error(`fixture does not contain ${from}`);
  return html.replace(from, to);
}

function check(html: string): string[] {
  return checkPage(html, {
    page: PAGE,
    expectedLang: "en",
    messages: MESSAGES,
  });
}

describe("checkPage", () => {
  it("passes a minimal valid page", () => {
    expect(check(VALID)).toEqual([]);
  });

  describe("links", () => {
    it("fails an outbound link, naming its href", () => {
      const html = variant(VALID, `href="/de/"`, `href="https://example.com/"`);
      expect(check(html)).toEqual([
        `${PAGE}: link is not a local language switch: https://example.com/`,
      ]);
    });

    it("fails an <a> with no href", () => {
      const html = variant(
        VALID,
        `<a href="/de/" hreflang="de">`,
        `<a hreflang="de">`,
      );
      expect(check(html)).toEqual([
        `${PAGE}: link is not a local language switch: missing href`,
      ]);
    });

    it("ignores <a> markup inside an HTML comment or a script string", () => {
      const html = variant(
        VALID,
        "</article>",
        `</article>
        <!-- <a href="https://x">old link</a> -->
        <script>const template = '<a href="https://x">x</a>';</script>`,
      );
      expect(check(html)).toEqual([]);
    });

    it("fails an outbound link inside <template> content", () => {
      const html = variant(
        VALID,
        "</article>",
        `</article>
        <template><div><a href="https://x">x</a></div></template>`,
      );
      expect(check(html)).toEqual([
        `${PAGE}: link is not a local language switch: https://x`,
      ]);
    });

    it("fails an outbound <area>", () => {
      const html = variant(
        VALID,
        "</article>",
        `</article>
        <map name="m"><area href="https://x" alt="x"></map>`,
      );
      expect(check(html)).toEqual([
        `${PAGE}: link is not a local language switch: https://x`,
      ]);
    });

    it("fails a meta refresh redirect, whatever the attribute's case", () => {
      const html = variant(
        VALID,
        "<title>",
        `<meta http-equiv="Refresh" content="0;url=https://x"><title>`,
      );
      expect(check(html)).toEqual([
        `${PAGE}: <meta http-equiv="refresh"> would redirect the visitor`,
      ]);
    });

    it("reads single-quoted hrefs instead of reporting them missing", () => {
      expect(check(variant(VALID, `href="/de/"`, `href='/de/'`))).toEqual([]);
      expect(check(variant(VALID, `href="/de/"`, `href='https://x'`))).toEqual([
        `${PAGE}: link is not a local language switch: https://x`,
      ]);
    });
  });

  it("fails a disclosure that starts open", () => {
    const html = variant(VALID, "<details>", "<details open>");
    expect(check(html)).toEqual([
      `${PAGE}: optional explanations must start collapsed`,
    ]);
  });

  it("fails reordered h2 headings, quoting the expected and found order", () => {
    const html = page([
      HEADER,
      main([RECOGNISE, RECIPIENT, SENDER, EXPOSED]),
      MODULE,
    ]);
    const found = [
      MESSAGES.recognise.heading,
      MESSAGES.recipient.heading,
      MESSAGES.sender.heading,
      MESSAGES.exposed.heading,
    ];
    expect(check(html)).toEqual([
      `${PAGE}: task guidance and recovery must precede optional education: ` +
        `expected <article> <h2> ${JSON.stringify(EXPECTED_HEADINGS)}, ` +
        `found ${JSON.stringify(found)}`,
    ]);
  });

  describe("guidance visible without JS", () => {
    const visible =
      "recipient guidance and exposure warning must remain visible without JS";

    it("fails when exposed.body is moved inside <details>", () => {
      const moved = variant(
        variant(EXPOSED, "<p>Treat it as exposed.</p>", ""),
        "<p>Change the password.</p>",
        "<p>Treat it as exposed.</p>",
      );
      const html = page([
        HEADER,
        main([RECIPIENT, SENDER, moved, RECOGNISE]),
        MODULE,
      ]);
      expect(check(html)).toEqual([
        `${PAGE}: ${visible}: web.lookalike.exposed.body is inside <details>`,
      ]);
    });

    it("fails when recipient.body is inside a [hidden] element", () => {
      const html = variant(
        VALID,
        "<p>Ask the sender to confirm the link.</p>",
        "<div hidden><p>Ask the sender to confirm the link.</p></div>",
      );
      expect(check(html)).toEqual([
        `${PAGE}: ${visible}: web.lookalike.recipient.body is inside <div hidden>`,
      ]);
    });

    it("fails when recipient.body is missing", () => {
      const html = variant(
        VALID,
        "<p>Ask the sender to confirm the link.</p>",
        "",
      );
      expect(check(html)).toEqual([
        `${PAGE}: ${visible}: no <article> <p> reads web.lookalike.recipient.body ` +
          JSON.stringify(MESSAGES.recipient.body),
      ]);
    });
  });

  describe("header language navigation", () => {
    const precede = "header language navigation must precede the warning";

    it("fails a language nav that follows the article", () => {
      const html = page([main(), HEADER, MODULE]);
      expect(check(html)).toEqual([
        `${PAGE}: ${precede}: the <article> comes before the <nav>`,
      ]);
    });

    it("fails a language nav with the wrong aria-label", () => {
      const html = variant(
        VALID,
        `aria-label="Language"`,
        `aria-label="Languages"`,
      );
      expect(check(html)).toEqual([
        `${PAGE}: ${precede}: aria-label is "Languages", expected "Language"`,
      ]);
    });
  });

  describe("official address", () => {
    it("fails an address that is not the canonical hostname", () => {
      const html = variant(
        VALID,
        "<span>secret.com</span>",
        "<span>secret.co</span>",
      );
      expect(check(html)).toEqual([
        `${PAGE}: official address reads "onetimesecret.co", ` +
          `expected "${CANONICAL_HOSTNAME}"`,
      ]);
    });

    it("fails an address with a gap between its parts", () => {
      const html = variant(
        VALID,
        "<span>onetime</span><span>",
        "<span>onetime</span> <span>",
      );
      expect(check(html)).toEqual([
        `${PAGE}: official address reads "onetime secret.com", ` +
          `expected "${CANONICAL_HOSTNAME}"`,
      ]);
    });

    it("fails a page with no data-official-address element", () => {
      const html = variant(VALID, " data-official-address", "");
      expect(check(html)).toEqual([
        `${PAGE}: no [data-official-address] element, expected one reading ` +
          `"${CANONICAL_HOSTNAME}"`,
      ]);
    });
  });
});
