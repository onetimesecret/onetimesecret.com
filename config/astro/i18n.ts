// config/astro/i18n.ts

export function createConfig() {
  return {
    // All pages, including static prerendered pages, have access to Astro.currentLocale.
    defaultLocale: "en",
    locales: ["en"],
    routing: {
      // https://docs.astro.build/en/guides/internationalization/#prefixdefaultlocale
      prefixDefaultLocale: true,
      // https://docs.astro.build/en/reference/configuration-reference/#i18nroutingredirecttodefaultlocale
      redirectToDefaultLocale: false,
    },
  };
}
