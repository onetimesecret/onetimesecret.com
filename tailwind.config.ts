// tailwind.config.ts

import defaultTheme from "tailwindcss/defaultTheme";
import typography from "@tailwindcss/typography";

// https://tailwindcss.com/docs/installation/framework-guides/astro
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  safelist: [
    "rounded-l-sm",
    "rounded-r-sm",
    "rounded-l-md",
    "rounded-r-md",
    "rounded-l-lg",
    "rounded-r-lg",
    "rounded-l-xl",
    "rounded-r-xl",
    "rounded-l-2xl",
    "rounded-r-2xl",
    "rounded-l-3xl",
    "rounded-r-3xl",
    "rounded-l-full",
    "rounded-r-full",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        serif: defaultTheme.fontFamily.serif,
        sans: defaultTheme.fontFamily.sans,
        /* In CSS: font-family: theme('fontFamily.brand'); */
        brand: ["Zilla Slab", ...defaultTheme.fontFamily.serif],
        mono: defaultTheme.fontFamily.mono,
      },
      aspectRatio: {
        "3/2": "3 / 2",
      },
      fontSize: {
        "sm/6": ["0.875rem", "1.5rem"],
        "base/7": ["1rem", "1.75rem"],
        "lg/8": ["1.125rem", "2rem"],
        "xl/8": ["1.25rem", "2rem"],
      },
      textWrap: {
        pretty: "pretty",
      },
      colors: {
        // https://javisperez.github.io/tailwindcolorshades/?flamingo=dc4a22&guardsman-red=23b5dd
        brand: {
          50: "#fcf8f2",
          100: "#fcf4e8",
          200: "#f7dec3",
          300: "#f0c39e",
          400: "#e68b5e",
          500: "#dc4a22",
          600: "#c43d1b",
          700: "#a32d12",
          800: "#85200c",
          900: "#631507",
          950: "#400b03",
        },
        branddim: {
          "50": "#fcf8f2",
          "100": "#faf0e3",
          "200": "#f0d7bd",
          "300": "#e8bb99",
          "400": "#d67e56",
          "500": "#c43d1b",
          "600": "#b03317",
          "700": "#94270f",
          "800": "#751b09",
          "900": "#591205",
          "950": "#380902",
        },
        brandcomp: {
          50: "#f2fbfc",
          100: "#e8fafc",
          200: "#c3f0f7",
          300: "#a0e6f2",
          400: "#5fcfe8",
          500: "#23b5dd",
          600: "#1c9cc7",
          700: "#1478a6",
          800: "#0d5985",
          900: "#073b63",
          950: "#032140",
        },
        brandcompdim: {
          "50": "#f2fbfc",
          "100": "#e3f7fa",
          "200": "#bfebf2",
          "300": "#99dae8",
          "400": "#57bdd9",
          "500": "#1c9cc7",
          "600": "#1786b3",
          "700": "#0f6594",
          "800": "#0a4c78",
          "900": "#053359",
          "950": "#021e3b",
        },
      },
    },
  },
  plugins: [typography],
};
