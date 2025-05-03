import { createI18n } from 'vue-i18n';
import en from '../locales/en.json';

type MessageSchema = typeof en;

export const i18n = createI18n<[MessageSchema], 'en'>({
  legacy: false, // Set to false to use Composition API
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en
  },
  silentTranslationWarn: true,
  silentFallbackWarn: true
});

export default i18n;
