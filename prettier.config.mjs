// prettier.config.ts
//
// prettier.config.ts, .prettierrc.ts, prettier.config.mts, or .prettierrc.mts
// https://prettier.io/docs/configuration

// import { type Config } from "prettier";

const config = {
  trailingComma: "all",
  // Force one attribute per line in HTML, Vue, and JSX
  singleAttributePerLine: true,
  // Place the > of a multi-line element on the same line
  bracketSameLine: true,
  plugins: [
    "prettier-plugin-astro",
    "prettier-plugin-tailwindcss",
    "prettier-plugin-vue",
  ],
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
    {
      files: "*.vue",
      options: {
        parser: "vue",
      },
    },
  ],
};

export default config;
