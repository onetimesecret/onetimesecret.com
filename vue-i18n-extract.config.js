module.exports = {
  // Files to scan for i18n keys
  "vueFiles": "./src/**/*.?(js|ts|vue)",

  // Language JSON files
  "languageFiles": "./src/locales/*.json",

  // Directories or files to exclude from scanning
  "exclude": [
    "node_modules",
    "dist",
    ".astro"
  ],

  // Output report to file (set to path for file output)
  "output": false,

  // Default behavior for adding missing keys (CLI flag overrides this)
  "add": false,

  // Default behavior for removing unused keys (CLI flag overrides this)
  "remove": false,

  // Enable Vue 3 Composition API support
  "composition": true,

  // CI mode: exit with error code if missing keys are detected
  "ci": false,

  // Nested key separator
  "separator": ".",

  // When adding keys, provide value from key if true
  "noEmptyTranslation": false,

  // Regex patterns to match i18n usage
  "matchPattern": [
    // Match $t('key') or this.$t('key')
    "(?:\\$|this\\.|\\w+\\.)t\\(\\s*['\"`]([\\w\\d\\.-]+)['\"`]",

    // Match t('key') for Composition API
    "t\\(\\s*['\"`]([\\w\\d\\.-]+)['\"`]",

    // Match i18n.t('key')
    "i18n\\.t\\(\\s*['\"`]([\\w\\d\\.-]+)['\"`]",

    // Match useI18n().t('key')
    "useI18n\\(\\)\\s*\\.\\s*t\\(\\s*['\"`]([\\w\\d\\.-]+)['\"`]"
  ],

  // Match HTML attributes with i18n
  "matchVueAttr": [
    "v-t",
    ":t",
    "t"
  ]
}
