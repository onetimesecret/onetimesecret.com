import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";

import HeroTitle from "@/components/vue/homepage/HeroTitle.vue";
import de from "@/i18n/ui/de.json";
import en from "@/i18n/ui/en.json";
import es from "@/i18n/ui/es.json";
import fr from "@/i18n/ui/fr.json";

const messages = { en, de, es, fr };
// Independent of locale data: the hero asks about a password, then offers a link.
const semantics = {
  en: { password: /password/i, link: /link/i },
  de: { password: /passwort/i, link: /link/i },
  es: { password: /contraseña/i, link: /enlace/i },
  fr: { password: /mot de passe/i, link: /lien/i },
};

describe("HeroTitle — localized rendering", () => {
  for (const locale of ["en", "de", "es", "fr"] as const) {
    it(`renders both complete ${locale} lines without fallback or word splitting`, () => {
      const i18n = createI18n({
        legacy: false,
        locale,
        fallbackLocale: false,
        messages,
      });
      const wrapper = mount(HeroTitle, { global: { plugins: [i18n] } });
      const heading = wrapper.get("h1#hero-heading");
      const title = messages[locale].web.homepage.hero.title;
      const lines = heading.findAll(":scope > span");

      expect(wrapper.findAll("h1")).toHaveLength(1);
      expect(lines).toHaveLength(2);
      expect(lines[0].text()).toBe(title.line1);
      expect(lines[1].text()).toBe(title.line2);
      expect(heading.get(".gradient-text").text()).toBe(title.line2);
      expect(heading.text()).toBe(`${title.line1} ${title.line2}`);
      expect(title.line1).toMatch(semantics[locale].password);
      expect(title.line1).toMatch(/\?$/);
      expect(title.line2).toMatch(semantics[locale].link);
      expect(heading.text()).not.toContain("Onetime Secret");
      expect(heading.find("em").exists()).toBe(false);
      expect(wrapper.text()).toContain(
        messages[locale].web.homepage.hero.badge,
      );
      expect(wrapper.text()).toContain(
        messages[locale].web.homepage.hero.subtitle,
      );
      expect(Object.keys(title).sort()).toEqual(["line1", "line2"]);
      wrapper.unmount();
    });
  }

  it("lets translators reorder each complete line independently", () => {
    const title = {
      line1: "Ein Passwort möchten Sie senden?",
      line2: "Stattdessen senden Sie einen Link.",
    };
    const i18n = createI18n({
      legacy: false,
      locale: "de",
      fallbackLocale: false,
      messages: {
        de: {
          ...de,
          web: {
            ...de.web,
            homepage: {
              ...de.web.homepage,
              hero: { ...de.web.homepage.hero, title },
            },
          },
        },
      },
    });
    const wrapper = mount(HeroTitle, { global: { plugins: [i18n] } });
    const heading = wrapper.get("h1");
    expect(heading.findAll(":scope > span")[0].text()).toBe(title.line1);
    expect(heading.get(".gradient-text").text()).toBe(title.line2);
    expect(heading.text()).toBe(`${title.line1} ${title.line2}`);
    wrapper.unmount();
  });
});
