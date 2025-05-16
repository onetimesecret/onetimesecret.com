# CLAUDE.md - Agent Guidelines for OnetimeSecret.com

## i18n

The default english translation is provided in the `src/locales/en.json` file.
Look at the heirarchical keys in the JSON file to understand the structure and
how properly reference them in Vue components (e.g. `$t('web.secrets.enterPassphrase')`).

Proper stylization of project name: "Onetime Secret".

DO NOT ADD TEXT unless using the i18n system. Use existing keys or create new ones.

### i18n Management Tools

The project uses `vue-i18n-extract` to manage i18n keys. These npm scripts are available:

- `pnpm i18n:scan` - Scan for missing and unused keys without making changes
- `pnpm i18n:add` - Add missing keys to locale files (with empty values)
- `pnpm i18n:remove` - Remove unused keys from locale files

Configuration is supposed to be in `vue-i18n-extract.config.js` but the command ignores it:
- Standard Vue: `$t('key')` or `this.$t('key')`
- Composition API: `t('key')`
- Module import: `i18n.t('key')` or `useI18n().t('key')`
- HTML attributes: `v-t="key"`, `:t="key"`, `t="key"`

## Build/Lint/Test Commands
- Build: `pnpm build` (production) or `pnpm build:local` (development)
- Dev server: `pnpm dev` or `pnpm dev:local` (with local config)
- Lint: `pnpm lint` or `pnpm lint:fix` (auto-fix issues)
- Type check: `pnpm type-check` or `pnpm type-check:watch` (watch mode)
- Vue tests: `pnpm test` (all) or `pnpm test:base run --filter=<test-name>` (single)
- Ruby tests: `pnpm rspec` or `bundle exec rspec <file_path>`
- E2E tests: `pnpm playwright` or `pnpm exec playwright test <test-file>`

## Code Style Guidelines
- **EOF newlines**: when adding a file, it needs a newline at the end
- **Commit Messages**: Use imperative mood, prefix with issue number `[#123]`
- **TypeScript**: Strict mode, explicit types, max 100 chars per line
- **Vue Components**: Use Composition API with `<script setup>`, camelCase props
- **Error Handling**: Use typed error handling with Zod for validations
- **State Management**: Use Pinia stores with `storeToRefs()` for reactive props
- **Imports**: Group imports (builtin → external → internal), alphabetize
- **Testing**: Max 300 lines per test file, use descriptive test names
- **API Logic**: Prefer small, focused functions (max 50 lines)
- **Styling**: Use Tailwind classes with consistent ordering
- **Accessibility**: Ensure all components are accessible, a11y, and follow WCAG guidelines
- Vue components should be written in a consistent style, using the Composition API with `<script setup lang="ts>`.
- Vue components should be styled using Tailwind classes with class lists should wrap long lines.
- Avoid deep nesting (max 3 levels) and limit function parameters (max 3).

### Project Version Reference

## Astro Vuejs 3 Frontend Framework Versions
```json
{
  "astro": "^5.7.10",
  "@astrojs/vue": "^5.0.13",
  "vue": "^3.5.13",
  "vue-router": "^4.4.5",
  "pinia": "^3.0.1",
  "vue-i18n": "^11.1.2",
  "zod": "^3.24.1",
  "vite": "^5.4.11",
  "typescript": "^5.6.3",
  "vue-tsc": "^2.1.10",
  "vitest": "^2.1.8",
  "tailwindcss": "4.1.5",
  "@tailwindcss/vite": "4.1.5",
  "@headlessui/vue": "^1.7.23",
  "@sentry/astro": "^9.15.0",
  "@vitejs/plugin-vue": "^5.1.4",
  "eslint": "9.25.1",
  "axios": "^1.7.7"
}
