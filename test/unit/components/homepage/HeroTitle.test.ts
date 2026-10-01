import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';

import HeroTitle from '@/components/vue/homepage/HeroTitle.vue';
import de from '@/i18n/ui/de.json';
import en from '@/i18n/ui/en.json';
import es from '@/i18n/ui/es.json';
import fr from '@/i18n/ui/fr.json';

const messages = { en, de, es, fr };
const propositions = {
  en: 'Run your own secret service.',
  de: 'Betreiben Sie Ihren eigenen Dienst zum Teilen von Geheimnissen.',
  es: 'Opere su propio servicio para compartir secretos.',
  fr: 'Gérez votre propre service de partage de secrets.',
};

describe('HeroTitle — localized rendering', () => {
  for (const locale of ['en', 'de', 'es', 'fr'] as const) {
    it(`renders the complete ${locale} proposition without fallback or word splitting`, () => {
      const i18n = createI18n({ legacy: false, locale, fallbackLocale: false, messages });
      const wrapper = mount(HeroTitle, { global: { plugins: [i18n] } });
      const heading = wrapper.get('h1#hero-heading');

      expect(wrapper.findAll('h1')).toHaveLength(1);
      expect(heading.get('.gradient-text').text()).toBe(propositions[locale]);
      expect(heading.text()).toBe(`Onetime Secret ${propositions[locale]}`);
      expect(heading.find('em').exists()).toBe(false);
      expect(wrapper.text()).toContain(messages[locale].web.homepage.hero.badge);
      expect(wrapper.text()).toContain(messages[locale].web.homepage.hero.subtitle);
      expect(Object.keys(messages[locale].web.homepage.hero.title)).toEqual(['line1', 'line2']);
      wrapper.unmount();
    });
  }

  it('lets translators reorder the entire proposition as a single message', () => {
    const proposition = 'Geheimnisse teilen: Ihr eigener Dienst.';
    const i18n = createI18n({
      legacy: false,
      locale: 'de',
      messages: {
        de: {
          ...de,
          web: {
            ...de.web,
            homepage: {
              ...de.web.homepage,
              hero: { ...de.web.homepage.hero, title: { line1: 'Onetime Secret', line2: proposition } },
            },
          },
        },
      },
    });
    const wrapper = mount(HeroTitle, { global: { plugins: [i18n] } });
    expect(wrapper.get('h1 .gradient-text').text()).toBe(proposition);
    wrapper.unmount();
  });
});
