/**
 * @file logo.test.ts
 * @description Guards the BIMI logo published at https://onetimesecret.com/bimi/logo.svg
 *
 * BIMI (Brand Indicators for Message Identification) requires the logo to be
 * an "SVG Tiny Portable/Secure" (SVG P/S) document. Mailbox providers such as
 * Gmail and Apple Mail silently refuse to display a logo that breaks any of
 * the profile rules. Gmail additionally caps the file at 32 KB and requires an
 * absolute pixel size of at least 96 pixels.
 *
 * The rules below are the SVG P/S profile (draft-svg-tiny-ps-abrotman-12,
 * section 2) plus the BIMI Group's published logo guidance. See docs/bimi.md
 * for the full runbook.
 *
 * The same rules double as an XSS guard: the file is served same-origin as
 * image/svg+xml, so "no script, no handlers, no external references" matters
 * for the website as much as for mailbox providers.
 *
 * IMPORTANT: once a Verified Mark Certificate (VMC) has been issued, the
 * certificate embeds a hash of this exact file. Changing a single byte breaks
 * certificate validation until a new certificate is issued. The hash pin at
 * the bottom of this file exists to make that consequence impossible to miss.
 */

import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const LOGO_PATH = resolve(__dirname, '../../../public/bimi/logo.svg');
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Gmail rejects indicators larger than 32 KB. */
const MAX_BYTES = 32 * 1024;

/**
 * Every element SVG Tiny 1.2 defines, minus the ones the SVG P/S profile
 * removes (draft-svg-tiny-ps-abrotman section 2.3: image, switch, multimedia,
 * interactivity, linking, scripting and animation). An allowlist rather than a
 * denylist so that anything a drawing tool sneaks in (filter, mask, clipPath,
 * pattern, marker, symbol, style, foreignObject...) fails the same way.
 * Embedded fonts (section 17) remain permitted.
 */
const ALLOWED_ELEMENTS = new Set([
  'circle',
  'defs',
  'desc',
  'ellipse',
  'font',
  'font-face',
  'font-face-name',
  'font-face-src',
  'font-face-uri',
  'g',
  'glyph',
  'hkern',
  'line',
  'linearGradient',
  'metadata',
  'missing-glyph',
  'path',
  'polygon',
  'polyline',
  'radialGradient',
  'rect',
  'solidColor',
  'stop',
  'svg',
  'tbreak',
  'text',
  'textArea',
  'title',
  'tspan',
  'use',
]);

/**
 * Attributes that have no meaning in SVG Tiny 1.2 / SVG P/S. `style` and
 * `class` need CSS, which Tiny 1.2 does not have. The conditional-processing
 * attributes belong to `switch`, which the profile removes.
 */
const FORBIDDEN_ATTRIBUTES = [
  'class',
  'requiredExtensions',
  'requiredFeatures',
  'requiredFormats',
  'requiredFonts',
  'style',
  'systemLanguage',
];

/**
 * Attributes the profile says SHOULD NOT be present and, if present, MUST
 * hold exactly this value (section 2.3).
 */
const CONSTRAINED_ROOT_ATTRIBUTES: Record<string, string> = {
  externalResourcesRequired: 'false',
  focusable: 'false',
  playbackOrder: 'all',
  snapshotTime: 'none',
  timelineBegin: 'onLoad',
  zoomAndPan: 'disable',
};

/**
 * SHA-256 of public/bimi/logo.svg. If this assertion fails you have changed
 * the BIMI logo. That is fine BEFORE a VMC is ordered. AFTER a VMC has been
 * issued, the certificate must be re-issued against the new file before the
 * change is deployed, otherwise every mailbox provider will drop the logo.
 * Update the pin only as part of that deliberate process.
 */
const PINNED_SHA256 = '8b10dad94195cf1a58f54c58b15b0383cd10337b03a71b98e3fd62a1c865ad1d';

const raw = readFileSync(LOGO_PATH);
const source = raw.toString('utf8');

function parseSvg(text: string): Document {
  // Refuse to hand a document with a DOCTYPE or entity declarations to the
  // parser at all. The profile forbids them, and entity expansion is the
  // classic way to make an XML parser misbehave.
  if (/<!DOCTYPE/i.test(text) || /<!ENTITY/i.test(text)) {
    throw new Error('public/bimi/logo.svg declares a DOCTYPE or XML entities');
  }
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const error = doc.getElementsByTagName('parsererror')[0];
  if (error) {
    throw new Error(`public/bimi/logo.svg is not well-formed XML: ${error.textContent}`);
  }
  return doc;
}

describe('BIMI logo (public/bimi/logo.svg)', () => {
  const doc = parseSvg(source);
  const root = doc.documentElement;
  const allElements = Array.from(doc.getElementsByTagName('*'));

  describe('file', () => {
    it('is under the 32 KB limit enforced by Gmail', () => {
      expect(statSync(LOGO_PATH).size).toBeLessThanOrEqual(MAX_BYTES);
    });

    it('is valid UTF-8 without a byte order mark', () => {
      expect(() => new TextDecoder('utf-8', { fatal: true }).decode(raw)).not.toThrow();
      expect(Array.from(raw.subarray(0, 3))).not.toEqual([0xef, 0xbb, 0xbf]);
      expect(source.startsWith('<?xml')).toBe(true);
    });

    it('uses LF line endings only', () => {
      expect(source).not.toContain('\r');
    });

    it('does not declare a DOCTYPE or XML entities', () => {
      expect(source).not.toMatch(/<!DOCTYPE/i);
      expect(source).not.toMatch(/<!ENTITY/i);
    });
  });

  describe('root <svg> element', () => {
    it('is an svg element in the SVG namespace', () => {
      expect(root.localName).toBe('svg');
      expect(root.namespaceURI).toBe(SVG_NS);
    });

    it('declares version="1.2" and baseProfile="tiny-ps"', () => {
      expect(root.getAttribute('version')).toBe('1.2');
      expect(root.getAttribute('baseProfile')).toBe('tiny-ps');
    });

    it('does not carry x or y attributes', () => {
      expect(root.hasAttribute('x')).toBe(false);
      expect(root.hasAttribute('y')).toBe(false);
    });

    it('only uses the profile-mandated values for behavioural attributes', () => {
      for (const [name, allowed] of Object.entries(CONSTRAINED_ROOT_ATTRIBUTES)) {
        if (root.hasAttribute(name)) {
          expect(root.getAttribute(name), name).toBe(allowed);
        }
      }
    });

    it('has a square viewBox so mail clients can scale it', () => {
      const viewBox = root.getAttribute('viewBox');
      expect(viewBox).toBeTruthy();
      const [minX, minY, width, height] = (viewBox as string)
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      expect(minX).toBe(0);
      expect(minY).toBe(0);
      expect(width).toBeGreaterThan(0);
      expect(width).toBe(height);
    });

    it('declares a square size in absolute pixels of at least 96 (Gmail rule)', () => {
      // Gmail: "The image size must be a minimum height and width of 96 pixels"
      // and "must be specified in absolute pixels", never percentages.
      const width = root.getAttribute('width');
      const height = root.getAttribute('height');
      expect(width).toMatch(/^\d+(px)?$/);
      expect(height).toMatch(/^\d+(px)?$/);
      expect(width).toBe(height);
      expect(Number.parseInt(width as string, 10)).toBeGreaterThanOrEqual(96);
    });
  });

  describe('<title>', () => {
    it('is the first child element of <svg> and carries the brand name', () => {
      expect(root.firstElementChild?.localName).toBe('title');
      const titles = Array.from(root.children).filter(child => child.localName === 'title');
      expect(titles).toHaveLength(1);
      expect(titles[0].textContent?.trim()).toBe('Onetime Secret');
    });

    it('stays within the recommended 64 characters', () => {
      const title = doc.getElementsByTagName('title')[0];
      expect(title.textContent?.trim().length).toBeLessThanOrEqual(64);
    });

    it('has a non-empty <desc> for accessibility (recommended by Gmail)', () => {
      const descs = Array.from(doc.getElementsByTagName('desc'));
      expect(descs.length).toBeGreaterThanOrEqual(1);
      for (const desc of descs) {
        expect(desc.textContent?.trim()).not.toBe('');
      }
    });
  });

  describe('content restrictions', () => {
    it('uses only elements permitted by the SVG P/S profile', () => {
      const offenders = allElements
        .map(element => element.localName)
        .filter(name => !ALLOWED_ELEMENTS.has(name));
      expect(offenders).toEqual([]);
    });

    it('keeps every element in the SVG namespace', () => {
      const foreign = allElements.filter(element => element.namespaceURI !== SVG_NS);
      expect(foreign.map(element => element.tagName)).toEqual([]);
    });

    it('does not reference external resources', () => {
      for (const element of allElements) {
        for (const attr of Array.from(element.attributes)) {
          if (attr.localName === 'href') {
            expect(attr.value, `${element.localName}@${attr.name}`).toMatch(/^#/);
          }
          expect(attr.value, `${element.localName}@${attr.name}`).not.toMatch(
            /url\(\s*['"]?\s*(https?:|\/\/|data:)/i
          );
        }
      }
    });

    it('does not use CSS or conditional-processing attributes', () => {
      for (const element of allElements) {
        const present = FORBIDDEN_ATTRIBUTES.filter(name => element.hasAttribute(name));
        expect(present, element.localName).toEqual([]);
      }
    });

    it('does not contain event handler attributes', () => {
      for (const element of allElements) {
        const handlers = Array.from(element.attributes)
          .map(attr => attr.name)
          .filter(name => /^on[a-z]/i.test(name));
        expect(handlers, element.localName).toEqual([]);
      }
    });

    it('renders at least two colours', () => {
      const colours = new Set<string>();
      for (const element of allElements) {
        for (const name of ['fill', 'stroke']) {
          const value = element.getAttribute(name)?.trim().toLowerCase();
          if (value && value !== 'none') {
            colours.add(value);
          }
        }
      }
      expect(colours.size).toBeGreaterThanOrEqual(2);
    });

    it('paints a solid background covering the whole canvas (Gmail rule)', () => {
      const [, , vbWidth, vbHeight] = (root.getAttribute('viewBox') as string)
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      const background = Array.from(root.children).find(
        child => !['title', 'desc', 'metadata', 'defs'].includes(child.localName)
      );
      expect(background?.localName).toBe('rect');
      expect(Number(background?.getAttribute('x') ?? 0)).toBe(0);
      expect(Number(background?.getAttribute('y') ?? 0)).toBe(0);
      expect(Number(background?.getAttribute('width'))).toBe(vbWidth);
      expect(Number(background?.getAttribute('height'))).toBe(vbHeight);
      expect(background?.getAttribute('fill')).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe('certificate binding', () => {
    it('matches the pinned SHA-256 (see comment on PINNED_SHA256 before changing)', () => {
      const digest = createHash('sha256').update(raw).digest('hex');
      expect(digest).toBe(PINNED_SHA256);
    });
  });
});
