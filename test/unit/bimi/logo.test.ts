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
 * section 2) plus the BIMI Group's published logo guidance. See docs/bimi.md for the full runbook.
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
 * Elements removed by the SVG P/S profile (draft-svg-tiny-ps-abrotman section
 * 2.3): the image and switch elements, multimedia, interactivity, linking,
 * scripting and animation. `foreignObject` and `style` are listed as well
 * because they do not exist in SVG Tiny 1.2 at all, and the profile adds no
 * elements beyond Tiny 1.2. Embedded fonts (section 17) remain permitted.
 */
const FORBIDDEN_ELEMENTS = [
  'a',
  'animate',
  'animateColor',
  'animateMotion',
  'animateTransform',
  'audio',
  'discard',
  'foreignObject',
  'handler',
  'image',
  'listener',
  'mpath',
  'script',
  'set',
  'style',
  'switch',
  'video',
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
const PINNED_SHA256 = '9e9cabeecc13458255b78055f00bfb0c897316d677ba52c0f16e7a667b3ba2e5';

const raw = readFileSync(LOGO_PATH);
const source = raw.toString('utf8');

function parseSvg(text: string): Document {
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

  describe('file', () => {
    it('is under the 32 KB limit enforced by Gmail', () => {
      expect(statSync(LOGO_PATH).size).toBeLessThanOrEqual(MAX_BYTES);
    });

    it('is UTF-8 without a byte order mark', () => {
      expect(raw[0]).not.toBe(0xef);
      expect(source.startsWith('<?xml')).toBe(true);
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
    it('is present as a direct child with the brand name', () => {
      const titles = Array.from(root.childNodes).filter(
        (node): node is Element =>
          node.nodeType === 1 && (node as Element).localName === 'title'
      );
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
    const allElements = Array.from(doc.getElementsByTagName('*'));

    it('uses no elements removed by the SVG P/S profile', () => {
      const offenders = allElements
        .map(element => element.localName)
        .filter(name => FORBIDDEN_ELEMENTS.includes(name));
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

    it('does not use CSS (unsupported in SVG Tiny 1.2)', () => {
      const styled = allElements.filter(element => element.hasAttribute('style'));
      expect(styled.map(element => element.localName)).toEqual([]);
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
  });

  describe('certificate binding', () => {
    it('matches the pinned SHA-256 (see comment on PINNED_SHA256 before changing)', () => {
      const digest = createHash('sha256').update(raw).digest('hex');
      expect(digest).toBe(PINNED_SHA256);
    });
  });
});
