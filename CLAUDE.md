# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Onetime Secret is an Astro 5+ static site generation (SSG) website that allows users to securely share sensitive information through self-destructing links. The site is built with Vue 3 components and Tailwind CSS styling.

**Tech Stack:**
- Astro 5+ (SSG) with Vue 3.5+ islands
- TypeScript 5.8+ with strict mode
- Tailwind CSS 4.1.5
- vue-i18n for internationalization
- nanostores for state management (not Pinia/Vuex - required for Astro partial hydration)
- Vite 6+ build tool
- pnpm package manager

## Essential Commands

```bash
# Development
pnpm dev              # Start dev server with host access
pnpm type-check       # Type check TypeScript
pnpm lint:fix         # Lint and auto-fix issues

# Build & Preview
pnpm build            # Production build
pnpm preview          # Preview production build

# Code Quality (run before committing)
pnpm type-check       # REQUIRED: Check TypeScript types
pnpm lint:fix         # REQUIRED: Fix linting issues
pnpm check            # REQUIRED: Verify Astro components

# i18n Management
pnpm i18n:scan        # Check for missing/unused translations
pnpm i18n:add         # Add missing translation keys
```

## Architecture & Code Organization

```
/src
  /pages/             # Astro pages (file-based routing)
    /[lang]/          # Localized pages
  /components/
    /vue/             # Vue components
      /icons/         # Icon system (OIcon.vue, IconSources.vue)
      /forms/         # Form components
      /layouts/       # Layout components
  /layouts/           # Astro layouts
  /i18n/              # Translation files (ui/*.json)
  /stores/            # nanostores (state management)
  /utils/             # Utility functions
  /App.ts             # Vue app initialization with i18n
```

**Key Architectural Decisions:**
- Vue components use Astro's partial hydration (islands architecture)
- State must use nanostores (framework-agnostic) instead of Pinia/Vuex
- All routing handled by Astro's file-based system in `/pages`
- i18n setup happens in `App.ts` before component hydration

## Critical Development Rules

### 1. Internationalization (MANDATORY)
```vue
<!-- ALWAYS use i18n - NEVER hardcode text -->
{{ $t('web.secrets.enterPassphrase') }}
```
Translation files: `src/i18n/ui/*.json`

### 2. Icon System
```vue
<!-- ALWAYS use OIcon component -->
<OIcon collection="name" class="optional-classes" />
```
Icon sprites: `src/components/vue/icons/IconSources.vue`

### 3. Vue Components
- MUST use Composition API with `<script setup lang="ts">`
- Props in camelCase
- Explicit TypeScript types required

### 4. State Management
- MUST use nanostores (not Pinia/Vuex)
- Required for Astro's partial hydration architecture

### 5. Code Style
- Max 100 characters per line
- Imports: built-in → external → internal (alphabetized)
- Commit format: `[#123] Add feature`

## Path Aliases

```typescript
import Component from '@/components/Component.vue';      // src/
import Config from '@config/app.ts';                     // config/
import Root from '@root/astro.config.ts';                // project root
```

## Pre-Commit Checklist

Before committing any changes, run:
1. `pnpm type-check` - Ensure no TypeScript errors
2. `pnpm lint:fix` - Fix all linting issues
3. `pnpm check` - Verify Astro components
4. `pnpm i18n:scan` - Check for missing translations

## Additional Resources

- Design issues and solutions: [DESIGN_TODOS.md](./DESIGN_TODOS.md)
- Sentry implementation: [SENTRY-IMPLEMENTATION.md](./SENTRY-IMPLEMENTATION.md)
