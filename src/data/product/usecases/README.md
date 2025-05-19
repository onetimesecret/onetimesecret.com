
# Use Case Content Architecture: Strategy and Rationale

The primary goal of this architecture is to create a system for managing "Use Case" content that is maintainable, scalable, and straightforward to translate into multiple languages.

## Core Components & Their Roles:

1.  **Localization Files (`src/i18n/ui/*.json` - e.g., `en.json`)**
    *   **Purpose**: This is the single source of truth for all user-facing text strings.
    *   **Structure**: Standard JSON format where keys (e.g., `"web.useCases.developer.title"`) map to their corresponding translated strings (e.g., `"Developer"`).
    *   **Benefits**:
        *   **Centralized Translations**: Simplifies the translation workflow. Translators can work directly with these JSON files without needing to touch the codebase.
        *   **Easy Language Addition**: Adding a new language involves creating a new locale file (e.g., `es.json`) with the same keys.

2.  **Individual Use Case Modules (`src/data/product/usecases/*UseCase.ts` - e.g., `developerUseCase.ts`)**
    *   **Purpose**: Each file defines the complete data structure for a single, specific use case (Developer, IT Professional, HR Manager, Legal Team).
    *   **Structure**: Typically exports a function (e.g., `getDeveloperUseCase(t: Function): UseCase`) that accepts the translation function (`t`) from `vue-i18n` as an argument and returns a `UseCase` object.
    *   **Key Responsibilities**:
        *   **Defining Non-Translatable Data**: Specifies properties unique to the use case that don't require translation, such as:
            *   `id`: A unique machine-readable identifier (e.g., `"developer"`).
            *   `icon`: An identifier for a visual icon (e.g., `"code-bracket"`).
            *   `ctaLink`: The target URL for the call-to-action button (e.g., `"/create"`).
        *   **Mapping to Translation Keys**: For all display text (title, description, benefits, example secrets, compliance info, CTA text), it uses the `t` function to reference the appropriate keys in the locale files (e.g., `title: t("web.useCases.developer.title")`).
    *   **Benefits**:
        *   **Modularity & Separation of Concerns**: Each use case is a self-contained unit.
        *   **Readability & Maintainability**: Easy to understand and modify the data for a specific use case without affecting others.
        *   **Scalability**: Adding a new use case is as simple as creating a new module following the established pattern.
        *   **Type Safety**: Ensures that the object returned by each function conforms to the `UseCase` TypeScript type, catching errors early.

3.  **Use Case Aggregator (`src/data/product/usecases/index.ts`)**
    *   **Purpose**: To collect and provide access to all defined use cases.
    *   **Structure**: Exports a primary function (e.g., `getUseCases(t: Function): UseCase[]`).
    *   **Responsibility**: This function imports the getter functions from each individual use case module, calls them with the passed-in `t` function, and returns an array of fully constituted `UseCase` objects (with translated strings).
    *   **Benefits**: Provides a clean, single point of entry for components or other parts of the application to retrieve all use case data.

4.  **Vue Component (`src/components/vue/homepage/UseCaseSelector.vue`)**
    *   **Purpose**: To display the use case information interactively to the user.
    *   **Responsibilities**:
        *   It fetches the array of `UseCase` objects by calling `getUseCases(t)` (where `t` is obtained from `useI18n()`).
        *   Manages the user's selection of a use case (e.g., via a dropdown).
        *   Dynamically renders the details (description, example secret, benefits, compliance info, CTA) of the `selectedUseCase`.
        *   Any static labels within the component template itself (like section headers "Example Secret", "Key Benefits") are also translated using the `t()` function directly in the template.
    *   **Benefits**: The component works with fully prepared, translated data objects. This keeps the component's logic focused on presentation and interaction, rather than on data fetching or translation string assembly.

## Underlying Principles of This Approach:

*   **Internationalization (i18n) by Design**: The system is built with translation as a core requirement, not an afterthought.
*   **Data-Driven Content**: The Vue component's display is driven by the structured data provided by the use case modules. This decouples content from presentation.
*   **Clear Separation of Responsibilities**:
    *   Locale files (`*.json`): Store the text.
    *   Individual use case modules (`*UseCase.ts`): Define the structure and content (including non-translatable data and translation key mappings) for each use case.
    *   Aggregator (`index.ts`): Collects and provides all use cases.
    *   Vue component (`UseCaseSelector.vue`): Presents the data and handles user interaction.
*   **Developer Experience**: This structured approach is logical and predictable, making it easier for developers to understand the flow of data, maintain the existing codebase, and add new use cases or languages.

Even though the individual `*UseCase.ts` files now primarily map translation keys for their textual content, they remain valuable for defining the non-translatable, structural aspects of each use case (like `id`, `icon`, `ctaLink`) and for enforcing the `UseCase` type. This maintains a clean, organized, and type-safe way to manage distinct content entities.
