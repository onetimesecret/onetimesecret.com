/**
 * @file jurisdictionIcons.test.ts
 * @description Every jurisdiction icon must resolve to a symbol in OtsSprites,
 * which SvgSprites.astro mounts. OIcon renders `<use href="#<collection>-<name>">`,
 * so a typo or an ots globe that was never copied into OtsSprites.vue renders
 * as an empty box rather than failing the build.
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import OtsSprites from '@/components/vue/icons/OtsSprites.vue';
import { jurisdictions } from '@/data/ops/jurisdictions';

// The fa6 earth-* outer disc that every generated globe starts with.
const DISC = 'M0 256a256 256 0 1 1 512 0a256 256 0 1 1-512 0';

describe('jurisdiction icons', () => {
  const root: Element = mount(OtsSprites).element;
  const symbols = Array.from(root.querySelectorAll('symbol'));
  const available = new Set(symbols.map((s) => s.id));

  it.each(jurisdictions.map((j) => [j.identifier, j.icon] as const))(
    '%s icon has an ots sprite symbol',
    (_identifier, icon) => {
      expect(icon.collection).toBe('ots');
      expect(available).toContain(`ots-${icon.name}`);
    }
  );

  it('draws every ots symbol in currentColor on the 512 globe disc', () => {
    expect(symbols.length).toBeGreaterThan(0);
    for (const symbol of symbols) {
      expect(symbol.getAttribute('viewBox')).toBe('0 0 512 512');
      const paths = Array.from(symbol.querySelectorAll('path'));
      expect(paths.length).toBeGreaterThan(0);
      expect(paths[0].getAttribute('d')?.startsWith(DISC)).toBe(true);
      for (const path of paths) expect(path.getAttribute('fill')).toBe('currentColor');
    }
  });
});
