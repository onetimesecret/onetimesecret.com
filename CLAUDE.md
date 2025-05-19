# CLAUDE.md - Agent Guidelines for OnetimeSecret.com

## Project Overview

Onetime Secret is an Astro 5+ static site generation (SSG) website that allows users to securely share sensitive information through self-destructing links. The site is built with Vue 3 and Tailwind CSS.

Proper stylization of project name: "Onetime Secret".

## Icons

Use `<OIcon>` component from `src/components/vue/icons/OIcon.vue` for all icons:

```vue
<OIcon collection="name" class="optional-classes" />
```

SVG sprites are available in `src/components/vue/icons/IconSources.vue`.

## i18n

Translations are managed in `src/i18n/ui/en.json` and other language files. Use the keys hierarchically:

```vue
{{ $t('web.secrets.enterPassphrase') }}
```

**IMPORTANT**: All text must use the i18n system. Use existing keys or create new ones.

## Build Commands

Development:
- Dev server: `pnpm dev` or `pnpm dev:local` (with local config)
- Type check: `pnpm type-check` or `pnpm type-check:watch` (watch mode)

Production:
- Build: `pnpm build` (production) or `pnpm build:local` (development)

Quality:
- Lint: `pnpm lint` or `pnpm lint:fix` (auto-fix issues)
- Vue tests: `pnpm test` (all) or `pnpm test:base run --filter=<test-name>` (single)
- Ruby tests: `pnpm rspec` or `bundle exec rspec <file_path>`
- E2E tests: `pnpm playwright` or `pnpm exec playwright test <test-file>`

## Code Style Guidelines

### General
- Max line length: 100 characters
- EOF newlines required
- Commit message format: `[#123] Add feature` (imperative mood with issue number)
- Avoid deep nesting (max 3 levels)
- Limit function parameters (max 3)

### TypeScript
- Use strict mode and explicit types
- Use Zod for validation and typed error handling

### Vue Components
- Use Composition API with `<script setup lang="ts">`
- Use camelCase for props
- Use Tailwind classes with consistent ordering
- Long class lists should wrap lines

### State Management
- Use nanostores (@see https://docs.astro.build/en/recipes/sharing-state-islands/)
- UI frameworks like React/Vue use "context" providers, but these won't work when partially hydrating components in Astro/Markdown. Nano Stores are framework-agnostic. Astro values flexibility with consistent developer experience regardless of framework preference.

### Imports
- Group and alphabetize: built-in → external → internal

### Testing
- Max 300 lines per test file
- Use descriptive test names

### Accessibility
- Ensure WCAG compliance
- Use proper ARIA attributes

## Design TODOs

See [DESIGN_TODOS.md](./DESIGN_TODOS.md) for the list of design issues and their recommended solutions.

## Project Dependencies

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
```
