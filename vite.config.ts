// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  define: {
    "process.env.VITE_BASE_URL": JSON.stringify(viteBaseUrl),
    "process.env.VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS": JSON.stringify(
      viteAdditionalServerAllowedHosts,
    ),

    __VUE_PROD_DEVTOOLS__: "false",
  },
});
