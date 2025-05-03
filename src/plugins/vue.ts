import type { App, Plugin } from 'vue';
import { createI18n } from 'vue-i18n';

// Import translations
import en from '../locales/en.json';

/**
 * i18n instance with translations
 */
export const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en
  }
});

/**
 * Vue plugin that installs all required plugins and configurations
 */
export const VuePlugin: Plugin = {
  install(app: App) {
    // Install i18n
    app.use(i18n);

    // Configure global properties
    app.config.errorHandler = (err, instance, info) => {
      console.error('Vue Error:', err);
      console.info('Error Info:', info);
    };

    // Add other plugins here as needed
  }
};

export default VuePlugin;
