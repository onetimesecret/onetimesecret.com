/**
 * @file OtsSprites.test.ts
 * @description Every jurisdiction icon must resolve to a symbol in a sprite
 * that SvgSprites.astro mounts. OIcon renders `<use href="#<collection>-<name>">`,
 * so a typo or an ots globe that was never copied into OtsSprites.vue renders
 * as an empty box rather than failing the build.
 *
 * Mounted with `createApp` rather than @vue/test-utils, which this repo does
 * not depend on.
 */

import { describe, expect, it } from 'vitest';
import { createApp } from 'vue';
import FontAwesome6Sprites from '@/components/vue/icons/FontAwesome6Sprites.vue';
import OtsSprites from '@/components/vue/icons/OtsSprites.vue';
import { jurisdictions } from '@/data/ops/jurisdictions';

const symbolIds = (component: Parameters<typeof createApp>[0]): string[] => {
  const host = document.createElement('div');
  const app = createApp(component);
  app.mount(host);
  const ids = Array.from(host.querySelectorAll('symbol')).map((s) => s.id);
  app.unmount();
  return ids;
};

describe('jurisdiction icons', () => {
  const available = new Set([...symbolIds(OtsSprites), ...symbolIds(FontAwesome6Sprites)]);

  it.each(jurisdictions.map((j) => [j.identifier, j.icon] as const))(
    '%s icon has a sprite symbol',
    (_identifier, icon) => {
      expect(available).toContain(`${icon.collection}-${icon.name}`);
    }
  );

  it('uses the regional ots globes rather than the fa6 continent globes', () => {
    for (const { icon } of jurisdictions) {
      expect(icon.collection).toBe('ots');
    }
  });

  it('draws every ots symbol in currentColor on the 512 globe disc', () => {
    const host = document.createElement('div');
    const app = createApp(OtsSprites);
    app.mount(host);
    const symbols = Array.from(host.querySelectorAll('symbol'));
    expect(symbols.length).toBeGreaterThan(0);
    for (const symbol of symbols) {
      expect(symbol.getAttribute('viewBox')).toBe('0 0 512 512');
      const paths = Array.from(symbol.querySelectorAll('path'));
      expect(paths.length).toBeGreaterThan(0);
      for (const path of paths) expect(path.getAttribute('fill')).toBe('currentColor');
    }
    app.unmount();
  });
});
