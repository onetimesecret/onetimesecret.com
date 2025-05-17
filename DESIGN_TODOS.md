# Design TODOs for Onetime Secret

This document outlines design issues identified on the Onetime Secret development site and recommended solutions.

## High Priority


### 1. Complete Internationalization Implementation
- **Issue**: Language switching appears incomplete
- **Task**: Finish i18n implementation using Vue-i18n
- **Solution**: Audit and complete translation keys, fix language switcher
- **Files**: Language files, i18n configuration
- **Testing**: Verify all text is properly translated in supported languages

### 2. ~~Standardize Navigation Bar~~ DONE
- **Issue**: Navigation bar appears/disappears across pages
- **Task**: Implement consistent navigation component
- **Solution**: Create a shared navigation layout component
- **Files**: Create `/src/layouts/MainLayout.astro` if not exists
- **Testing**: Verify navigation appears consistently across all pages

### 3. ~~Standardize the About Page~~ DONE
- **Issue**: About page layout inconsistent with other pages
- **Task**: Create a consistent layout for the About page
- **Solution**: Create an astro layout for content pages like About
- **Files**: Update `/src/pages/[lang]/about.astro`
- **Testing**: Verify layout consistency

### 4. Improve Homepage Information Architecture
- **Issue**: Core functionality explanation is limited
- **Task**: Add concise feature highlights with visual aids
- **Solution**: Create feature highlight component for homepage
- **Files**: Homepage template, new feature component
- **Testing**: User testing for comprehension



## Medium Priority

### 5. Improve Form Feedback
- **Issue**: No visual feedback during form submission
- **Task**: Add loading states and clear success/error messages
- **Solution**: Implement form state management with loading, success, and error states
- **Files**: Update form components, create notification component
- **Testing**: Verify all form state transitions work correctly

### 6. Mobile Responsiveness
- **Issue**: Interface designed primarily for desktop
- **Task**: Implement responsive design across all components
- **Solution**: Use Tailwind breakpoints consistently
- **Files**: Audit and update all component templates
- **Testing**: Test across various screen sizes with browser devtools

### 7. Accessibility Improvements
- **Issue**: Contrast issues, some elements lack proper ARIA attributes
- **Task**: Ensure all text meets WCAG AA standards (4.5:1 ratio)
- **Solution**: Audit contrast ratios, implement proper ARIA roles
- **Files**: Global stylesheet, component templates
- **Testing**: Run accessibility tests with axe-core or similar

## Lower Priority

### 8. Regional Domain Banner Enhancement
- **Issue**: Banner lacks clear action path
- **Task**: Add more context or clearer call-to-action
- **Solution**: Redesign banner to include better explanation and actionable button
- **Files**: Banner component
- **Testing**: User testing for clarity

### 9. Standardize Button Styling
- **Issue**: Inconsistent button styling
- **Task**: Create button style guide and implementation
- **Solution**: Document button variants and implement consistent styling
- **Files**: Create `/docs/ButtonStyleGuide.md` and update button components
- **Testing**: Visual verification of button consistency

### 10. Button Targeting Problems
- **Issue**: Inconsistent selector targeting making buttons unreliable
- **Task**: Standardize button component implementation
- **Solution**: Create a shared button component with reliable class structure
- **Files**: Create `/src/components/vue/buttons/BaseButton.vue`
- **Testing**: Verify buttons are consistently targetable via selectors

## DONE

### 1. Fix Pricing Page
- **Issue**: Pricing page displays blank content
- **Task**: Investigate and repair content loading issues
- **Solution**: Check for API connectivity or implement proper error handling if data fails to load
- **Files**: `/src/pages/en/pricing.astro`, relevant Pinia store files
- **Testing**: Verify page loads in all environments (local, dev, production)
