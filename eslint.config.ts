import js from "@eslint/js";
import * as globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,vue}"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,vue}"],
    languageOptions: { globals: globals.browser },
  },
  tseslint.configs.recommended,

  /**
   * Global Vue Component Rules
   * Disables multi-word component name requirement for all Vue components
   */
  {
    files: ["**/*.vue"],
    rules: {
      "vue/multi-word-component-names": "off", // Allow single-word component names globally
    },
  },

  pluginVue.configs["flat/essential"],
  {
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
]);
