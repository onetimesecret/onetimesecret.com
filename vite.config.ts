// vite.config.ts
import { defineConfig } from "vite";

// Get environment variables for the configuration
const viteBaseUrl = import.meta.env.VITE_BASE_URL;
const viteAdditionalServerAllowedHosts =
  import.meta.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS ??
  import.meta.env.VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS;

export default defineConfig({
  define: {
    "import.meta.env.VITE_BASE_URL": JSON.stringify(viteBaseUrl),
    "import.meta.env.VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS": JSON.stringify(
      viteAdditionalServerAllowedHosts,
    ),

    __VUE_PROD_DEVTOOLS__: "false",
  },
});
