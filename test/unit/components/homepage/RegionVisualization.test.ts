/**
 * @file RegionVisualization.test.ts
 * @description Unit tests for the region-visualization dispatcher.
 *
 * The geometry contract is covered in GlobalInfrastructure.test.ts; what is
 * covered here is the dispatcher itself — that each variant resolves to a
 * real component (a broken dynamic import fails the suite rather than only
 * the page) and that the box reserved for it matches the variant.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import RegionVisualization, {
  type RegionVisualizationVariant,
} from '@/components/vue/homepage/regions/RegionVisualization.vue';

/** Warm the two lazily-imported globe modules. Without this their transitive
 *  imports can still be in flight when the environment tears down, which
 *  Vitest reports as an unhandled rejection. */
beforeAll(async () => {
  await Promise.all([
    import('@/components/vue/homepage/regions/RegionGlobeStatic.vue'),
    import('@/components/vue/homepage/regions/RegionGlobeRotating.vue'),
  ]);
});

const mountVariant = async (variant?: RegionVisualizationVariant) => {
  const wrapper = mount(RegionVisualization, {
    props: variant ? { variant } : {},
    shallow: true,
  });
  await flushPromises();
  return wrapper;
};

describe('RegionVisualization — variant dispatch', () => {
  it('renders the dot matrix by default', async () => {
    const wrapper = await mountVariant();
    expect(wrapper.html()).toContain('region-dot-matrix-stub');
  });

  it('renders the dot matrix when asked for it explicitly', async () => {
    const wrapper = await mountVariant('dot-matrix');
    expect(wrapper.html()).toContain('region-dot-matrix-stub');
  });

  it('resolves the static globe through its dynamic import', async () => {
    const wrapper = await mountVariant('globe-static');
    expect(wrapper.html()).toContain('region-globe-static-stub');
  });

  it('resolves the rotating globe through its dynamic import', async () => {
    const wrapper = await mountVariant('globe-rotating');
    expect(wrapper.html()).toContain('region-globe-rotating-stub');
  });
});

describe('RegionVisualization — reserved box', () => {
  it('reserves a wide box for the dot matrix', async () => {
    const wrapper = await mountVariant('dot-matrix');
    const style = wrapper.attributes('style');
    expect(style).toContain('aspect-ratio: 960 / 460');
    expect(style).toContain('max-width: 100%');
  });

  it.each<RegionVisualizationVariant>(['globe-static', 'globe-rotating'])(
    'reserves a square, capped box for %s',
    async variant => {
      const wrapper = await mountVariant(variant);
      const style = wrapper.attributes('style');
      expect(style).toContain('aspect-ratio: 1 / 1');
      expect(style).toContain('max-width: 480px');
    }
  );

  it('is decorative and hidden from assistive technology', async () => {
    const wrapper = await mountVariant();
    expect(wrapper.attributes('role')).toBe('presentation');
    expect(wrapper.attributes('aria-hidden')).toBe('true');
  });
});
