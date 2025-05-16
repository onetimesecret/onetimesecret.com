# UseCaseSelector Component

A dynamic, interactive component for the Onetime Secret homepage that tailors content based on the user's role or use case.

## Features

- Role-based selector using HeadlessUI's Listbox component
- Dynamically updates content based on user selection
- Shows relevant example secrets specific to each role
- Displays tailored benefits, compliance information, and CTAs
- Fully localized with vue-i18n integration
- Responsive design with TailwindCSS

## Requirements

- Vue 3 with Composition API
- HeadlessUI (`@headlessui/vue`)
- Heroicons (`@heroicons/vue`)
- TailwindCSS 4
- vue-i18n for translations

## Installation

1. Ensure you have the required dependencies:

```bash
pnpm add @headlessui/vue @heroicons/vue
```

2. Add the component to your Astro page or Vue component:

```vue
<script>
import UseCaseSelector from '@/components/vue/homepage/UseCaseSelector.vue';
</script>

<template>
  <UseCaseSelector />
</template>
```

## Localization

The component uses translations from `src/locales/en.json` under the `web.useCases` namespace. Make sure to add translations for all supported languages.

## Customization

To customize the component:

1. **Add or modify use cases** - Edit the `useCases` array in the component to add new roles or update existing ones
2. **Styling** - The component uses TailwindCSS classes that can be modified to match your design system
3. **Content structure** - Adjust the content layout in the template section as needed

## Integration Example

See `HomepageCombined.vue` for a complete example of integrating this component into a homepage layout.

## Accessibility

This component uses HeadlessUI's Listbox which provides full keyboard navigation and screen reader support. The component includes:

- Proper ARIA attributes
- Keyboard navigation
- Focus management
- Screen reader announcements
