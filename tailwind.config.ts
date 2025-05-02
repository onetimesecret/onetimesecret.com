//
// https://tailwindcss.com/docs/installation/framework-guides/astro
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
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
    },
  },
  plugins: [],
};
