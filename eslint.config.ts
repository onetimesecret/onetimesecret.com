// eslint.config.ts
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
// Removed: import { defineConfig } from "eslint/config"; // Use tseslint.config instead

export default tseslint.config(
  // Use the tseslint.config helper for type compatibility
  // Apply ESLint recommended rules
  js.configs.recommended,

  // Apply TypeScript recommended rules provided by tseslint
  // Spread the array returned by tseslint.configs.recommended
  ...tseslint.configs.recommended,

  // Apply Vue recommended rules for flat config
  // Ensure 'eslint-plugin-vue' supports flat config; adjust path if needed
  ...pluginVue.configs["flat/recommended"],

  // Custom configuration object for global settings
  {
    files: ["**/*.{js,mjs,cjs,ts,vue}"], // Target relevant file types
    languageOptions: {
      globals: {
        ...globals.browser, // Include standard browser globals
        process: "readonly", // Allow 'process' global, e.g., for process.env
      },
    },
    // Shared rules or settings can go here
  },

  // Specific configuration for Vue files
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        // Use the TypeScript parser for <script lang="ts"> blocks in Vue files
        parser: tseslint.parser,
        // Enable type-aware linting rules if needed (requires tsconfig.json)
        // project: true,
        // tsconfigRootDir: import.meta.dirname, // Or specify path to tsconfig.json
      },
    },
    rules: {
      // Add or override Vue-specific rules here if necessary
      "vue/html-self-closing": "warn",
      "vue/multi-word-component-names": "off", // Allow single-word names for test components
    },
  },

  // Configuration object for ignoring files/directories
  {
    ignores: [
      "node_modules/",
      "dist/",
      "coverage/",
      "*.d.ts", // Ignore TypeScript definition files
      // Add other patterns to ignore
    ],
  },
);
