// vite.config.ts
import { defineConfig } from "vite";

// Get environment variables for the configuration
const viteBaseUrl = process.env.VITE_BASE_URL;
const viteAdditionalServerAllowedHosts =
  process.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS ??
  process.env.VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS;

export default defineConfig({
  define: {
    "process.env.VITE_BASE_URL": JSON.stringify(viteBaseUrl),
    "process.env.VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS": JSON.stringify(
      viteAdditionalServerAllowedHosts,
    ),

    __VUE_PROD_DEVTOOLS__: "false",
  },
});
